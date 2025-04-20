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
const int ir1Pin = 2;  // Entry sensor
const int ir2Pin = 16; // Exit sensor

// Occupancy & Stack
int occupancyCount = 0;
unsigned long lastEventTime = 0;
const unsigned long DEBOUNCE_TIME = 500; // Reduced debounce for stack responsiveness

// Stack variables
int stack[2] = {0, 0};
int top = -1;

// Edge detection
int prevIR1State = HIGH;
int prevIR2State = HIGH;

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

void sendPostRequest(String timeStr) {
  if (WiFi.status() != WL_CONNECTED) connectToWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(intrusionURL);
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"description\":\"intrusion detected\",\"time\":\"" + timeStr + "\"}";
  int response = http.POST(payload);
  Serial.printf(response > 0 ? "✅ Intrusion alert sent. Code: %d\n" : "❌ Alert failed: %s\n", response, http.errorToString(response).c_str());
  http.end();
}

void sendOccupancyUpdate(int count) {
  if (WiFi.status() != WL_CONNECTED) connectToWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(occupancyURL);
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"count\":" + String(count) + "}";
  int response = http.PUT(payload);
  Serial.printf(response > 0 ? "📤 Occupancy updated: %d (Code: %d)\n" : "❌ Occupancy update failed: %s\n", count, response, http.errorToString(response).c_str());
  http.end();
}

void push(int value) {
  if (top < 1) {
    top++;
    stack[top] = value;
  }
}

void resetStack() {
  stack[0] = 0;
  stack[1] = 0;
  top = -1;
}

void loop() {
  static unsigned long lastWifiCheck = 0;
  if (millis() - lastWifiCheck > 30000) {
    if (WiFi.status() != WL_CONNECTED) connectToWiFi();
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

  // Read sensor state
  int ir1State = digitalRead(ir1Pin);
  int ir2State = digitalRead(ir2Pin);

  // Falling edges
  bool ir1Triggered = (prevIR1State == HIGH && ir1State == LOW);
  bool ir2Triggered = (prevIR2State == HIGH && ir2State == LOW);
  prevIR1State = ir1State;
  prevIR2State = ir2State;

  if (!isNightTime) {
    // Day mode — intrusion detection
    if ((ir1Triggered || ir2Triggered) && millis() - lastEventTime > DEBOUNCE_TIME) {
      char timeStr[20];
      sprintf(timeStr, "%02d:%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
      Serial.printf("🚨 Intrusion Detected at %s\n", timeStr);
      sendPostRequest(String(timeStr));
      lastEventTime = millis();
    }
  } else {
    // Night mode — occupancy tracking using stack
    if (millis() - lastEventTime > DEBOUNCE_TIME) {
      if (ir1Triggered) {
        Serial.println("IR1 triggered (pushing 1)");
        push(1);
        lastEventTime = millis();
      } else if (ir2Triggered) {
        Serial.println("IR2 triggered (pushing 2)");
        push(2);
        lastEventTime = millis();
      }

      if (top == 1) {
        if (stack[0] == 1 && stack[1] == 2) {
          // Entry
          occupancyCount++;
          Serial.printf("👤 Entry confirmed. Count: %d\n", occupancyCount);
          sendOccupancyUpdate(occupancyCount);
        } else if (stack[0] == 2 && stack[1] == 1) {
          // Exit
          if (occupancyCount > 0) occupancyCount--;
          Serial.printf("🚪 Exit confirmed. Count: %d\n", occupancyCount);
          sendOccupancyUpdate(occupancyCount);
        } else {
          Serial.println("⚠️ Invalid sequence, ignoring.");
        }
        resetStack(); // Prepare for next detection
      }
    }
  }

  delay(50); // Small delay for stability
}
