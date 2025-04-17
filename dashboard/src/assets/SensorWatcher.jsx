import { useEffect } from 'react';
import axios from 'axios';

const SensorWatcher = () => {
  const API_KEY = "B3B8RCLYHX513ND1"; // Replace with your actual API key
  const calibrated = [8, 50, 45, 50, 10, 10]; // Threshold values for each field
  const messages = [
    "Alert at Cold storage temperature",
    "Alert at Cold storage humidity",
    "alert at flammable section temperture",
    "alert at flammable section humidity",
    "Alert at gas section",
    "Alert at gas section"
  ];

  useEffect(() => {
    const fetchAllSensorData = async () => {
      try {
        // 1) Get the existing alerts to check for duplicates
        const { data: existingAlerts = [] } = await axios.get("/api/alerts");
        console.log(existingAlerts);

        // 2) For each field (1 to 6), fetch the latest value from ThingSpeak
        for (let i = 0; i < 4; i++) {
          console.log(i);
          const fieldIndex = i + 1;
          const url = `https://api.thingspeak.com/channels/2909250/fields/${fieldIndex}/last.json?api_key=${API_KEY}`;
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`Error fetching sensor data (field${fieldIndex}): ${response.status}`);
          }

          const data = await response.json();
          console.log(data);
          const value = parseFloat(data[`field${fieldIndex}`]);

          // Check condition (here: if sensor value is above the threshold)
          if (((i==0 || i==2) && (value > calibrated[i])) || ((i==1 ||i==3) && value<calibrated[i])) {
            // Check whether an alert with the same description already exists
            const occurrence = existingAlerts.filter(
              (alert) => alert.description === messages[i]
            ).length;
            
            if (occurrence < 1) {
              // Create a new alert with current time and messages[i] as description
              const currentTime = new Date().toLocaleTimeString();
              await axios.post("/api/alerts/create", {
                description: messages[i],
                time: currentTime
              });
              // Update our local copy to include the new alert
              existingAlerts.push({ description: messages[i] });
            }
          }
        }
      } catch (error) {
        console.error("Error in SensorWatcher:", error);
      }
    };

    // Initial fetch
    fetchAllSensorData();

    // Then fetch every 10 seconds
    const intervalId = setInterval(fetchAllSensorData, 7000);
    return () => clearInterval(intervalId);
  }, []);

  return null; // This component does not render any UI
};

export default SensorWatcher;