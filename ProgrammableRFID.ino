#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 5      // Modify this to match your wiring
#define RST_PIN 22

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();      
  mfrc522.PCD_Init(); 
  Serial.println("Scan a card to check if it's writeable...");
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  byte block = 4;
  byte dataBlock[] = {
    'T', 'E', 'S', 'T', 'W', 'R', 'I', 'T', 'E', 'A', 'B', 'L', 'E', ' ', ' ', ' '
  };

  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF; // Default key (factory)

  // Authenticate
  MFRC522::StatusCode status;
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK) {
    Serial.println("Not Writeable: Authentication failed");
    mfrc522.PICC_HaltA();
    return;
  }

  // Try writing
  status = mfrc522.MIFARE_Write(block, dataBlock, 16);
  if (status == MFRC522::STATUS_OK) {
    Serial.println("Writeable ✅");
  } else {
    Serial.print("Not Writeable ❌: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
  }

  // Cleanup
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(2000); // Small delay before next scan
}
