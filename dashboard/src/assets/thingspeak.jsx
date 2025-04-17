import { useState, useEffect } from 'react';
import axios from 'axios';

const SensorDataDisplay = ({ fieldNumber = 1 }) => {
  const [sensorValue, setSensorValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_KEY = "B3B8RCLYHX513ND1";
  
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        setLoading(true);
        const url = `https://api.thingspeak.com/channels/2909250/fields/${fieldNumber}/last.json?api_key=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching sensor data: ${response.status}`);
        }
        
        const data = await response.json();
        const value = parseFloat(data[`field${fieldNumber}`]);
        setSensorValue(value);
        setError(null);
        
        if(value > 90) {
          await axios.post("/api/alerts/create", {
            description: `High ${(fieldNumber === 1) || (fieldNumber === 3) ? 'Temperature' : 'Humidity'} detected (${value}${(fieldNumber === 3) || (fieldNumber === 1) ? '°C' : '%'})`,
            time: new Date().toLocaleTimeString()
          });
        }
      } catch (err) {
        console.error('Failed to fetch sensor data:', err);
        setError('Failed to load sensor data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();
    const intervalId = setInterval(fetchSensorData, 5000);
    return () => clearInterval(intervalId);
  }, [fieldNumber, API_KEY]);

  // Determine sensor type for styling
  const isTemperature = (fieldNumber === 3 || fieldNumber === 1);
  const sensorType = isTemperature ? 'Temperature' : 'Humidity';
  const unit = isTemperature ? '°C' : '%';
  const icon = isTemperature ? '🌡️' : '💧';
  const bgColor = isTemperature ? 'bg-red-500/10' : 'bg-blue-500/10';
  const borderColor = isTemperature ? 'border-red-500/30' : 'border-blue-500/30';
  const textColor = isTemperature ? 'text-red-400' : 'text-blue-400';

  return (
    <div className={`w-full p-6 rounded-xl border ${borderColor} ${bgColor} shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className={`text-xl font-semibold ${textColor}`}>{sensorType}</h2>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isTemperature ? 'border-red-500' : 'border-blue-500'}`}></div>
        </div>
      ) : error ? (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-300">
          <p>⚠️ {error}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${textColor}`}>
              {sensorValue.toFixed(1)}
            </span>
            <span className="text-xl text-gray-400 mb-1">{unit}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
            <div 
              className={`h-2.5 rounded-full ${isTemperature ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (sensorValue / (isTemperature ? 60 : 100)) * 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0{unit}</span>
            <span>{isTemperature ? '60' : '100'}{unit}</span>
          </div>
          
          <p className="text-m text-gray-500 mt-4">
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
};

export default SensorDataDisplay;