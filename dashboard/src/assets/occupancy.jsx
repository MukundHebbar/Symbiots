import React, { useState, useEffect } from 'react';

const Occupancy = () => {
  const [occupancy, setOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch occupancy data on component mount
    fetchOccupancy();
    
    // Set up polling to refresh occupancy data (every 10 seconds)
    const interval = setInterval(fetchOccupancy, 10000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchOccupancy = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/occupancy');
      const data = await response.json();
      setOccupancy(data.count);
    } catch (error) {
      console.error('Error fetching occupancy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="occupancy-container">
      <div className="occupancy-card">
        <h2>Current Occupancy</h2>
        <div className="occupancy-value">
          {loading ? "..." : occupancy}
        </div>
      </div>
    </div>
  );
};

export default Occupancy;