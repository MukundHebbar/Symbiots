#include <WiFi.h>
#include <HTTPClient.h>
#include "time.h"

// Wi-Fi credentials
const char* ssid = "OnePlus 11R 5G";
const char* password = "c742jct2";

// API Endpoints
const char* intrusionURL = "http://192.168.63.200:5173/api/alerts/create";
const char* occupancyURL = "http://192.168.63.200:5173/api/occupancy";

// Time setup
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800; // IST: GMT+5:30
const int daylightOffset_sec = 0;

// Sensor pins
const int ir1Pin = 2;  // Entry sensor (outside)
const int ir2Pin = 16; // Exit sensor (inside)

// Tracking variables
int occupancyCount = 0;
unsigned long lastEventTime = 0;
const unsigned long DEBOUNCE_TIME = 1000; // 1 second debounce
enum SystemState { IDLE, ENTRY_STARTED, EXIT_STARTED };
SystemState currentState = IDLE;

void setup() {
  Serial.begin(115200);
  Serial.println("\nStarting Security System...");

  pinMode(ir1Pin, INPUT);
  pinMode(ir2Pin, INPUT);

  // Connect to Wi-Fi
  connectToWiFi();

  // Sync time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Time configured.");
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(" Failed to connect!");
  }
}

void sendPostRequest(String timeStr) {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  HTTPClient http;
  http.begin(intrusionURL);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"description\":\"intrusion detected\",\"time\":\"" + timeStr + "\"}";
  int response = http.POST(payload);

  if (response > 0) {
    Serial.printf("✅ Intrusion alert sent. Response Code: %d\n", response);
  } else {
    Serial.printf("❌ Error sending alert: %s\n", http.errorToString(response).c_str());
  }
  http.end();
}

void sendOccupancyUpdate(int count) {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  HTTPClient http;
  http.begin(occupancyURL);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"count\":" + String(count) + "}";
  int response = http.PUT(payload);

  if (response > 0) {
    Serial.printf("📤 Occupancy updated to %d. Response Code: %d\n", count, response);
  } else {
    Serial.printf("❌ Error updating occupancy: %s\n", http.errorToString(response).c_str());
  }
  http.end();
}

void loop() {
  // Check WiFi periodically
  static unsigned long lastWifiCheck = 0;
  if (millis() - lastWifiCheck > 30000) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Reconnecting WiFi...");
      connectToWiFi();
    }
    lastWifiCheck = millis();
  }

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    delay(1000);
    return;
  }

  int hour = timeinfo.tm_hour;
  bool isNightTime = (hour >= 23 || hour < 10); // 11pm to 10am

  int ir1State = digitalRead(ir1Pin);
  int ir2State = digitalRead(ir2Pin);

  if (!isNightTime) {
    // Intrusion detection mode
    if ((ir1State == LOW || ir2State == LOW) && millis() - lastEventTime > DEBOUNCE_TIME) {
      char timeStr[20];
      sprintf(timeStr, "%02d:%02d:%02d", hour, timeinfo.tm_min, timeinfo.tm_sec);
      Serial.printf("🚨 INTRUSION DETECTED at %s\n", timeStr);
      sendPostRequest(String(timeStr));
      lastEventTime = millis();
    }
  } 
  else {
    // Occupancy tracking mode with state machine
    if (millis() - lastEventTime > DEBOUNCE_TIME) {
      switch (currentState) {
        case IDLE:
          if (ir1State == LOW) {
            currentState = ENTRY_STARTED;
            lastEventTime = millis();
            Serial.println("Potential entry started (IR1 triggered)");
          } 
          else if (ir2State == LOW) {
            currentState = EXIT_STARTED;
            lastEventTime = millis();
            Serial.println("Potential exit started (IR2 triggered)");
          }
          break;

        case ENTRY_STARTED:
          if (ir2State == LOW) {
            // Entry confirmed (IR1 then IR2)
            occupancyCount++;
            Serial.printf("👤 Entry confirmed. Count: %d\n", occupancyCount);
            sendOccupancyUpdate(occupancyCount);
            currentState = IDLE;
            lastEventTime = millis();
          } 
          else if (millis() - lastEventTime > 2000) {
            // Timeout - reset to idle
            Serial.println("Entry sequence timed out");
            currentState = IDLE;
          }
          break;

        case EXIT_STARTED:
          if (ir1State == LOW) {
            // Exit confirmed (IR2 then IR1)
            if (occupancyCount > 0) occupancyCount--;
            Serial.printf("🚪 Exit confirmed. Count: %d\n", occupancyCount);
            sendOccupancyUpdate(occupancyCount);
            currentState = IDLE;
            lastEventTime = millis();
          } 
          else if (millis() - lastEventTime > 2000) {
            // Timeout - reset to idle
            Serial.println("Exit sequence timed out");
            currentState = IDLE;
          }
          break;
      }
    }
  }

  delay(50); // Short delay for stability
}