#include <WiFi.h>
#include <HTTPClient.h>
#include "time.h"

// WiFi credentials
const char* ssid = "Nothing nothing 2a";
const char* password = "Mukund2005";

// Server endpoint
const char* serverURL = "http://192.168.45.78:5173/api/alerts/create";

// Time setup
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800; // IST: GMT+5:30
const int daylightOffset_sec = 0;

// IR sensor pin
const int irPin = 14;

void setup() {
  Serial.begin(9600);
  pinMode(irPin, INPUT);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");

  // Configure time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Time configured.");
}

void sendPostRequest(String timeStr) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"description\":\"intrusion detected\",\"time\":\"" + timeStr + "\"}";
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      Serial.printf("✅ POST Sent. Response Code: %d\n", httpResponseCode);
    } else {
      Serial.printf("❌ Error sending POST: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("❌ WiFi not connected. Cannot send POST.");
  }
}

void loop() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("❌ Failed to get time");
    delay(1000);
    return;
  }

  int hour = timeinfo.tm_hour;
  int minute = timeinfo.tm_min;
  int irState = digitalRead(irPin);

  bool isNightOrMorning = (hour >= 23 || hour < 10);

  if (isNightOrMorning && irState == LOW) {
    char timeStr[6];
    sprintf(timeStr, "%02d:%02d", hour, minute);
    Serial.printf("🚨 INTRUSION ALERT 🚨 at %s\n", timeStr);

    sendPostRequest(String(timeStr)); // send POST request
  } else {
    Serial.printf("Time: %02d:%02d - All clear\n", hour, minute);
  }

  delay(2000); // check every 2 seconds
}
