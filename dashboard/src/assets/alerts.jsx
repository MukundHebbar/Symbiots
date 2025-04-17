import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/alerts');
            setAlerts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchAlerts();
        // Poll for new alerts every 5 seconds
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, []);

    const resolveAlert = async (id) => {
        try {
            await axios.delete(`/api/alerts/${id}`);
            // Update local alerts state by filtering out the resolved alert
            setAlerts(alerts.filter(alert => alert.id !== id));
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    return (
        <div className="w-full flex flex-col items-center mt-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Alerts</h2>
            <div className="w-1/2 min-w-[300px] bg-gray-100 rounded-lg p-4">
                {loading ? (
                    <div className="text-gray-800 text-center">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                    <div className="text-gray-800 text-center">No active alerts</div>
                ) : (
                    <ul className="space-y-2">
                        {alerts.map((alert) => (
                            <li 
                                key={alert.id}
                                className="flex justify-between items-center p-3 bg-red-100 border-l-4 border-red-500 rounded-md shadow-sm"
                            >
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">{alert.time}</span>
                                    </div>
                                    <p className="text-gray-800 font-medium">{alert.description}</p>
                                </div>
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md ml-4 text-sm transition-colors duration-200"
                                    onClick={() => resolveAlert(alert.id)}
                                >
                                    Resolve
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Alerts;