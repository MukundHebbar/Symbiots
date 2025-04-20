#include <WiFi.h>
#include <HTTPClient.h>
#include "time.h"

// Wi-Fi credentials
const char* ssid = "OnePlus 11R 5G";
const char* password = "c742jct2";

// API Endpoint
const char* occupancyURL = "http://192.168.63.200:5173/api/occupancy";

// Time config
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800; // IST: GMT+5:30
const int daylightOffset_sec = 0;

// Sensor pins
const int ir1Pin = 2;  // Exit sensor
const int ir2Pin = 16; // Entry sensor

int occupancyCount = 0;

void setup() {
  Serial.begin(115200);
  pinMode(ir1Pin, INPUT);
  pinMode(ir2Pin, INPUT);
  connectToWiFi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " Connected!" : " Failed to connect!");
}

void sendOccupancyUpdate(int count) {
  if (WiFi.status() != WL_CONNECTED) connectToWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(occupancyURL);
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"count\":" + String(count) + "}";
  int response = http.PUT(payload);
  Serial.printf("📤 Occupancy updated to %d. Code: %d\n", count, response);
  http.end();
}

void loop() {
  int ir1State = digitalRead(ir1Pin);
  int ir2State = digitalRead(ir2Pin);

  if (ir2State == LOW) {
    // Entry detected
    occupancyCount++;
    Serial.printf("👤 Entry detected. Count: %d\n", occupancyCount);
    sendOccupancyUpdate(occupancyCount);
    delay(5000);  // Ignore any further movement for 5 seconds
  } else if (ir1State == LOW) {
    // Exit detected
    if (occupancyCount > 0) occupancyCount--;
    Serial.printf("🚪 Exit detected. Count: %d\n", occupancyCount);
    sendOccupancyUpdate(occupancyCount);
    delay(5000);  // Ignore further movement for 5 seconds
  }

  delay(50); // Small stability delay
}
