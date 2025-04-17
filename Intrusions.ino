#include <WiFi.h>
#include <HTTPClient.h>
#include "time.h"

// WiFi credentials
const char* ssid = "Nothing nothing 2a";
const char* password = "Mukund2005";

// API Endpoints
const char* intrusionURL = "http://192.168.45.78:5173/api/alerts/create";
const char* occupancyURL = "http://192.168.45.78:5173/api/occupancy";

// Time setup
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800; // IST: GMT+5:30
const int daylightOffset_sec = 0;

// Sensor pins
const int irPin = 14;
const int trigPin = 12;
const int echoPin = 13;

// Occupancy tracking
int occupancyCount = 0;

void setup() {
  Serial.begin(9600);

  pinMode(irPin, INPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");

  // Sync time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Time configured.");
}

// Get distance from HC-SR04
long getDistanceCM() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  long distance = duration * 0.034 / 2;
  return distance;
}

// Send intrusion alert via POST
void sendPostRequest(String timeStr) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(intrusionURL);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"description\":\"intrusion detected\",\"time\":\"" + timeStr + "\"}";
    int response = http.POST(payload);

    if (response > 0) {
      Serial.printf("✅ POST Sent. Response Code: %d\n", response);
    } else {
      Serial.printf("❌ Error sending POST: %s\n", http.errorToString(response).c_str());
    }
    http.end();
  } else {
    Serial.println("❌ WiFi not connected. Cannot send POST.");
  }
}

// Send occupancy update via PUT
void sendOccupancyUpdate(int count) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(occupancyURL);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"count\":" + String(count) + "}";
    int response = http.PUT(payload);

    if (response > 0) {
      String resBody = http.getString();
      Serial.printf("📤 PUT Sent. Response Code: %d\n", response);
      Serial.println("📬 Server Response: " + resBody);
    } else {
      Serial.printf("❌ Error sending PUT: %s\n", http.errorToString(response).c_str());
    }
    http.end();
  } else {
    Serial.println("❌ WiFi not connected. Cannot send PUT.");
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
  bool isNightOrMorning = (hour >= 23 || hour < 10);

  int irState = digitalRead(irPin);

  if (isNightOrMorning) {
    // 🚨 Intrusion detection (night/morning)
    if (irState == LOW) {
      char timeStr[6];
      sprintf(timeStr, "%02d:%02d", hour, minute);
      Serial.printf("🚨 INTRUSION ALERT 🚨 at %s\n", timeStr);
      sendPostRequest(String(timeStr));
    } else {
      Serial.printf("Time: %02d:%02d - All clear (night mode)\n", hour, minute);
    }
  } else {
    // 👥 Occupancy tracking (daytime)
    long d1 = getDistanceCM();
    delay(150);
    long d2 = getDistanceCM();
    long delta = d2 - d1;

    if (abs(delta) > 15 && irState == LOW) {
      if (delta < 0) {
        occupancyCount++;
        Serial.println("👤 Entry detected.");
      } else {
        if (occupancyCount > 0) occupancyCount--;
        Serial.println("🚪 Exit detected.");
      }

      Serial.printf("👥 Occupancy: %d\n", occupancyCount);
      sendOccupancyUpdate(occupancyCount);
      delay(2000); // prevent bounce
    } else {
      Serial.printf("Time: %02d:%02d - No significant motion. IR: %d\n", hour, minute, irState);
    }
  }

  delay(1000);
}
