#include <SPI.h>
#include <MFRC522.h>

// ESP32 SPI pins (change if needed)
#define RST_PIN    22
#define SS_PIN     5
#define MOSI_PIN   23
#define MISO_PIN   19
#define SCK_PIN    18

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

struct CardData {
  byte id;
  byte key[4];
  int quantity;
};

// 🎴 6 card entries
CardData cards[] = {
  { 1, {0x01, 0x02, 0x03, 0x04}, 10 },
  { 2, {0x05, 0x06, 0x07, 0x08}, 20 },
  { 3, {0x09, 0x0A, 0x0B, 0x0C}, 30 },
  { 4, {0x0D, 0x0E, 0x0F, 0x10}, 40 },
  { 5, {0x11, 0x12, 0x13, 0x14}, 50 },
  { 6, {0x15, 0x16, 0x17, 0x18}, 60 }
};

const int NUM_CARDS = sizeof(cards) / sizeof(cards[0]);
const byte blockToWrite = 1;

void setup() {
  Serial.begin(115200);

  // Init custom SPI for ESP32
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);

  rfid.PCD_Init();
  delay(50);
  Serial.println("RFID writer ready. Enter ID number (1–6) to write:");

  // Default key
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;
}

void loop() {
  if (Serial.available()) {
    byte selectedId = Serial.parseInt();
    CardData* selected = nullptr;

    for (int i = 0; i < NUM_CARDS; i++) {
      if (cards[i].id == selectedId) {
        selected = &cards[i];
        break;
      }
    }

    if (!selected) {
      Serial.println("❌ Invalid ID! Enter 1–6.");
      return;
    }

    Serial.println("✅ Now place your RFID card...");

    // Wait for a card
    while (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial());

    byte dataBlock[16] = {0};

    // Write key (4 bytes)
    for (int i = 0; i < 4; i++) dataBlock[i] = selected->key[i];

    // Write quantity (4-byte int, big-endian)
    dataBlock[4] = (selected->quantity >> 24) & 0xFF;
    dataBlock[5] = (selected->quantity >> 16) & 0xFF;
    dataBlock[6] = (selected->quantity >> 8) & 0xFF;
    dataBlock[7] = selected->quantity & 0xFF;

    // Authenticate
    MFRC522::StatusCode status = rfid.PCD_Authenticate(
      MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockToWrite, &key, &(rfid.uid)
    );

    if (status != MFRC522::STATUS_OK) {
      Serial.print("Auth failed: ");
      Serial.println(rfid.GetStatusCodeName(status));
      return;
    }

    // Write to block
    status = rfid.MIFARE_Write(blockToWrite, dataBlock, 16);
    if (status != MFRC522::STATUS_OK) {
      Serial.print("Write failed: ");
      Serial.println(rfid.GetStatusCodeName(status));
    } else {
      Serial.println("✅ Write successful!");
    }

    // Halt and stop encryption after writing
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    // Optional: Add a small delay to ensure the card is ready before trying to read again
    delay(500);  // 500ms delay

    // Re-initialize and wait for the same card to be detected again
    Serial.println("Try to re-read the card...");
    while (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial());

    // Read UID again
    char uidString[20];
    sprintf(uidString, "%02X%02X%02X%02X", 
            rfid.uid.uidByte[0], 
            rfid.uid.uidByte[1], 
            rfid.uid.uidByte[2], 
            rfid.uid.uidByte[3]);

    Serial.print("UID Re-read: ");
    Serial.println(uidString);

    // Halt and stop encryption again
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    Serial.println("Enter another ID to write:");
  }
}
