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
#define TOXIC_SERVO_PIN 16
#define CORROSIVE_SERVO_PIN 17
#define COLD_SERVO_PIN 4

MFRC522 mfrc522(SS_PIN, RST_PIN);  
Servo flameServo, toxicServo, corrosiveServo, coldServo;  // 4 Servos

// Wi-Fi credentials
const char* ssid = "Nothing nothing 2a";
const char* password = "Mukund2005";

// Server endpoints
const char* rfidServerURL = "http://192.168.45.161:5173/api/rfid";  
const char* categoryServerURL = "http://192.168.45.161:5173/api/esp32";  

void setup() {
    Serial.begin(115200);
    SPI.begin();
    mfrc522.PCD_Init();

    // Attach servos to their respective pins
    flameServo.attach(FLAME_SERVO_PIN);
    toxicServo.attach(TOXIC_SERVO_PIN);
    corrosiveServo.attach(CORROSIVE_SERVO_PIN);
    coldServo.attach(COLD_SERVO_PIN);

    // Initialize all servos to 0° (closed position)
    flameServo.write(0);
    toxicServo.write(0);
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
        // Convert UID to string format
        char uid_string[20];
        sprintf(uid_string, "%02X%02X%02X%02X", 
                mfrc522.uid.uidByte[0], 
                mfrc522.uid.uidByte[1], 
                mfrc522.uid.uidByte[2], 
                mfrc522.uid.uidByte[3]);

        Serial.print("UID Detected: ");
        Serial.println(uid_string);

        // Send UID to the server
        sendToServer(uid_string);

        // Fetch updated category
        getCategoryFromServer();

        mfrc522.PICC_HaltA();  
        delay(1000);           
    }
}

// Function to send RFID UID to server via PUT request
void sendToServer(String uid) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(rfidServerURL);
        http.addHeader("Content-Type", "application/json");

        String jsonPayload = "{\"rfid\": \"" + uid + "\"}";
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
}

// Function to get category and updatedType from /api/esp32
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

            // Parse JSON response
            DynamicJsonDocument doc(256);  // Increased size to handle response safely
            DeserializationError error = deserializeJson(doc, response);
            
            if (!error) {
                // Extract "updatedType" from the JSON
                if (doc.containsKey("type")) {  
                    String updatedType = doc["type"].as<String>();  

                    Serial.print("Updated Type: ");
                    Serial.println(updatedType);

                    // Activate the corresponding servo
                    controlServo(updatedType);
                } else {
                    Serial.println("Error: 'updatedType' field not found in JSON.");
                }
            } else {
                Serial.print("Failed to parse JSON: ");
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

// Function to control servos based on updatedType
void controlServo(String updatedType) {
    if (updatedType == "flame") {
        Serial.println("Activating Flame Servo...");
        flameServo.write(90);
        delay(10000);
        flameServo.write(0);
    } 
    else if (updatedType == "toxic") {
        Serial.println("Activating Toxic Servo...");
        toxicServo.write(90);
        delay(10000);
        toxicServo.write(0);
    } 
    else if (updatedType == "corrosive") {
        Serial.println("Activating Corrosive Servo...");
        corrosiveServo.write(90);
        delay(10000);
        corrosiveServo.write(0);
    } 
    else if (updatedType == "others") {
        Serial.println("Activating Others Servo...");
        coldServo.write(90);
        delay(10000);
        coldServo.write(0);
    } 
    else {
        Serial.println("Unknown updatedType. No action taken.");
    }
}
