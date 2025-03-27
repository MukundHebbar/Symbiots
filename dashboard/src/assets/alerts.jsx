import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await axios.get('/api/alerts');
            setAlerts(response.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    return (
        <div className="w-full flex flex-col items-center mt-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Alerts</h2>
            <div className="w-1/2 min-w-[300px] bg-gray-100 rounded-lg p-4">
                {alerts.length === 0 ? (
                    <div className="text-gray-800 text-center">No active alerts</div>
                ) : (
                    <ul className="space-y-2">
                        {alerts.map((alert) => (
                            <li 
                                key={alert.id}
                                className="flex justify-between items-center p-2 border-b border-gray-200 text-gray-800"
                            >
                                <span>Type: {alert.type}</span>
                                <span>Location: {alert.location}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Alerts;