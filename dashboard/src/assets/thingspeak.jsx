import { useState, useEffect } from 'react';
import axios from 'axios';

const SensorDataDisplay = ({ fieldNumber = 1 }) => {
  const [sensorValue, setSensorValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API key directly included for simplicity
  const API_KEY = "B3B8RCLYHX513ND1"; // Replace this with your actual API key
  
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        setLoading(true);
        
        // API endpoint with API key as query parameter
        const url = `https://api.thingspeak.com/channels/2909250/fields/${fieldNumber}/last.json?api_key=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching sensor data: ${response.status}`);
        }
        
        const data = await response.json();
        const value = parseFloat(data[`field${fieldNumber}`]);
        setSensorValue(value);
        setError(null);
        
        // Compare sensor value and create alert if greater than 25
        if(value > 25) {
          await axios.post("/api/alerts/create", {
            description: "problem found",
            time: "12 am"
          });
        }
      } catch (err) {
        console.error('Failed to fetch sensor data:', err);
        setError('Failed to load sensor data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch data when component mounts
    fetchSensorData();
    
    // Refresh data every 5 seconds
    const intervalId = setInterval(fetchSensorData, 5000);
    
    return () => clearInterval(intervalId);
  }, [fieldNumber, API_KEY]);

  return (
    <div className="sensor-data-container">
      <h2>Latest Sensor Reading</h2>
      
      {loading && <p>Loading sensor data...</p>}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="sensor-value">
          <p>Field {fieldNumber}: <span className="value">{sensorValue}</span></p>
          <p className="last-updated">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default SensorDataDisplay;