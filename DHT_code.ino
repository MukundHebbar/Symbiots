#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ---------- DHT11 Configuration ----------
#define DHTPIN1 17
#define DHTPIN2 22
#define DHTTYPE DHT11
DHT dht1(DHTPIN1, DHTTYPE);
DHT dht2(DHTPIN2, DHTTYPE);

// ---------- WiFi Credentials ----------
const char* ssid = "OnePlus 11R 5G";
const char* password = "c742jct2";

// ---------- ThingSpeak MQTT Configuration ----------
const char* mqttServer = "mqtt3.thingspeak.com";
const int mqttPort = 1883;
const char* mqttUserName = "CSI6FC0KDgMzJiEHMA0PEA4";
const char* mqttPassword = "S7CQoulJAl0l6l2u3oLGGyhM";
const char* clientID = "CSI6FC0KDgMzJiEHMA0PEA4";
long channelID = 2909250;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);


// ---------- Timing ----------
long lastMsgTime = 0;
int updateInterval = 15 * 1000;  // 15 seconds


// ---------- Setup ----------
void setup() 
{
  Serial.begin(115200);
  delay(2000);

  dht1.begin();
  dht2.begin();  

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) 
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");

  mqttClient.setServer(mqttServer, mqttPort);
}


// ---------- Connect to MQTT ----------
void connectToMQTT() 
{
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect(clientID, mqttUserName, mqttPassword))
    {
      Serial.println("connected!");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying...");
      delay(2000);
    }
  }
}

// ---------- Publish Sensor Data ----------
void publishDHTData() {
  float temp1 = dht1.readTemperature();
  float hum1 = dht1.readHumidity();
  float temp2 = dht2.readTemperature();
  float hum2 = dht2.readHumidity();

  if(isnan(temp1) || isnan(hum1)) 
  {
    Serial.println("Failed to read from DHT1 sensor!");
    return;
  }

  if(isnan(temp2) || isnan(hum2)) 
  {
    Serial.println("Failed to read from DHT2 sensor!");
    return;
  }

  String payload1 = "field1=" + String(temp1) + " &field2=" + String(hum1);
  String payload2 = "field3=" + String(temp2) + " &field4=" + String(hum2);
   
  String topic = "channels/" + String(channelID) + "/publish";

  mqttClient.publish(topic.c_str(), payload1.c_str());
  mqttClient.publish(topic.c_str(), payload2.c_str());


  Serial.print("Published: ");
  Serial.println(payload1);
  Serial.println(payload2);
}

// ---------- Main Loop ----------
void loop() 
{
  if (WiFi.status() != WL_CONNECTED) 
  {
    WiFi.reconnect();
  }

  if (!mqttClient.connected()) 
  {
    connectToMQTT();
  }

  mqttClient.loop();

  if (millis() - lastMsgTime > updateInterval) 
  {
    publishDHTData();
    lastMsgTime = millis();
  }
}