#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>  
#include <ESP32Servo.h>  

// RFID Setup for ESP32
#define SS_PIN 5
#define RST_PIN 22

// Servo pins
#define FLAME_SERVO_PIN 15
#define OTHER_SERVO_PIN 16
#define CORROSIVE_SERVO_PIN 17
#define COLD_SERVO_PIN 4

MFRC522 mfrc522(SS_PIN, RST_PIN);  
Servo flameServo, otherServo, corrosiveServo, coldServo;

// Wi-Fi credentials
const char* ssid = "OnePlus 11R 5G";
const char* password = "c742jct2";

// Server endpoints
const char* rfidServerURL = "http://192.168.57.200:5173/api/rfid";  
const char* categoryServerURL = "http://192.168.57.200:5173/api/esp32";  

void setup() {
    Serial.begin(115200);
    SPI.begin();
    mfrc522.PCD_Init();

    // Attach servos
    flameServo.attach(FLAME_SERVO_PIN);
    otherServo.attach(OTHER_SERVO_PIN);
    corrosiveServo.attach(CORROSIVE_SERVO_PIN);
    coldServo.attach(COLD_SERVO_PIN);

    // Close all servos
    flameServo.write(0);
    otherServo.write(0);
    corrosiveServo.write(0);
    coldServo.write(0);

    Serial.println("Connecting to Wi-Fi...");
    WiFi.begin(ssid, password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 15) {
        delay(1000);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWi-Fi Connected!");
    } else {
        Serial.println("\nWi-Fi Connection Failed!");
    }

    Serial.println("RFID Reader Initialized. Scan your tag...");
}

void loop() {
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
        char uid_string[20];
        sprintf(uid_string, "%02X%02X%02X%02X", 
                mfrc522.uid.uidByte[0], 
                mfrc522.uid.uidByte[1], 
                mfrc522.uid.uidByte[2], 
                mfrc522.uid.uidByte[3]);

        Serial.print("UID Detected: ");
        Serial.println(uid_string);

        // Send UID + quantity read from card to server
        sendToServer(uid_string);

        // Fetch updated type from /api/esp32
        getCategoryFromServer();

        mfrc522.PICC_HaltA();
        delay(1000);
    }

    if (Serial.available()) {
        char input = Serial.read();
        closeAllServos();

        if (input == '1') { flameServo.write(90); delay(5000); flameServo.write(0); }
        else if (input == '2') { coldServo.write(90); delay(5000); coldServo.write(0); }
        else if (input == '3') { corrosiveServo.write(90); delay(5000); corrosiveServo.write(0); }
        else if (input == '4') { otherServo.write(90); delay(5000); otherServo.write(0); }
    }
}

void closeAllServos() {
    flameServo.write(0);
    coldServo.write(0);
    corrosiveServo.write(0);
    otherServo.write(0);
}

// ✅ NEW: Read payload from RFID and send JSON to server
void sendToServer(String uid) {
    byte block = 1;
    byte buffer[18];
    byte size = sizeof(buffer);

    MFRC522::MIFARE_Key key;
    for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

    MFRC522::StatusCode status = mfrc522.PCD_Authenticate(
        MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid)
    );

    if (status != MFRC522::STATUS_OK) {
        Serial.print("Auth failed: ");
        Serial.println(mfrc522.GetStatusCodeName(status));
        return;
    }

    status = mfrc522.MIFARE_Read(block, buffer, &size);
    if (status != MFRC522::STATUS_OK) {
        Serial.print("Read failed: ");
        Serial.println(mfrc522.GetStatusCodeName(status));
        return;
    }

    // Extract 4-byte quantity from byte 4-7
    int quantity = (buffer[4] << 24) | (buffer[5] << 16) | (buffer[6] << 8) | buffer[7];

    Serial.print("Quantity from RFID: ");
    Serial.println(quantity);

    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(rfidServerURL);
        http.addHeader("Content-Type", "application/json");

        String jsonPayload = "{\"rfid\": \"" + uid + "\", \"quantity\": " + quantity + "}";
        Serial.print("Sending JSON: ");
        Serial.println(jsonPayload);

        int httpResponseCode = http.PUT(jsonPayload);
        Serial.print("Server Response Code: ");
        Serial.println(httpResponseCode);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.print("Response: ");
            Serial.println(response);
        } else {
            Serial.println("Error in sending request");
        }

        http.end();
    } else {
        Serial.println("Wi-Fi not connected. Cannot send data.");
    }

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
}

void getCategoryFromServer() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(categoryServerURL);
        int httpResponseCode = http.GET();

        Serial.print("Category Server Response Code: ");
        Serial.println(httpResponseCode);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.print("Raw Server Response: ");
            Serial.println(response);

            DynamicJsonDocument doc(256);
            DeserializationError error = deserializeJson(doc, response);

            if (!error) {
                if (doc.containsKey("type")) {
                    String updatedType = doc["type"].as<String>();
                    Serial.print("Updated Type: ");
                    Serial.println(updatedType);
                    controlServo(updatedType);
                } else {
                    Serial.println("Error: 'type' field not found.");
                }
            } else {
                Serial.print("JSON parse failed: ");
                Serial.println(error.f_str());
            }
        } else {
            Serial.println("Error fetching category.");
        }

        http.end();
    } else {
        Serial.println("Wi-Fi not connected. Cannot fetch category.");
    }
}

void controlServo(String updatedType) {
    Serial.println("Controlling servo for type: " + updatedType);

    if (updatedType == "flame") {
        flameServo.write(90); delay(10000); flameServo.write(0);
    } else if (updatedType == "toxic") {
        otherServo.write(90); delay(10000); otherServo.write(0);
    } else if (updatedType == "corrosive") {
        corrosiveServo.write(90); delay(10000); corrosiveServo.write(0);
    } else if (updatedType == "others") {
        coldServo.write(90); delay(10000); coldServo.write(0);
    } else {
        Serial.println("Unknown type. No servo triggered.");
    }
}
