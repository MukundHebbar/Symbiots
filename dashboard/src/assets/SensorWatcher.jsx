import { useEffect } from 'react';
import axios from 'axios';

const SensorWatcher = () => {
  const API_KEY = "B3B8RCLYHX513ND1"; // Replace with your actual API key
  const fieldNumber = 1;
  const calibrated = [25, 10, 10, 10, 10 ,10] ; // need to be properly calibrated
  
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Build the ThingSpeak URL
        const url = `https://api.thingspeak.com/channels/2895650/fields/${fieldNumber}/last.json?api_key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error fetching sensor data: ${response.status}`);
        }
        
       const data = await response.json();
         value = parseFloat(data[`field${1}`]);
        
        // If value > 25, create an alert with current time
        
        if (value > 25) {
          const currentTime = new Date().toLocaleTimeString();
          await axios.post("/api/alerts/create", {
            description: "problem found",
            time: currentTime
          });
        }
      } catch (error) {
        console.error("Error in SensorWatcher:", error);
      }
    };

    // Initial fetch
    fetchSensorData();
    // Then fetch every 10 seconds
    const intervalId = setInterval(fetchSensorData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return null; // This component does not render any UI
};

export default SensorWatcher;