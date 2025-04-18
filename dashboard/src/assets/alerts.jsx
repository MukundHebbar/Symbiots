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
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, []);

    const resolveAlert = async (id) => {
        try {
            await axios.delete(`/api/alerts/${id}`);
            setAlerts(alerts.filter(alert => alert.id !== id));
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {/* Compact Header Section */}
    <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            <span className="block">System Alerts 🚨</span>
        </h2>
        <div className="mt-3 border-t border-gray-200 pt-3 flex justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
                Active Alerts: {alerts.length}
            </span>
        </div>
    </div>

    {/* Alert Container */}
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all duration-300">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-base font-medium text-gray-600">Loading alert data...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest alerts</p>
            </div>
        ) : alerts.length === 0 ? (
            <div className="text-center py-10 px-4">
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mb-3">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">All systems normal</h3>
                <p className="text-gray-600">No active alerts detected</p>
                <p className="text-xs text-gray-500 mt-2">Last checked: {new Date().toLocaleTimeString()}</p>
            </div>
        ) : (
            <ul className="divide-y divide-gray-200">
                {alerts.map((alert) => (
                    <li 
                        key={alert.id}
                        className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
                            alert.priority === 'high' ? 'bg-red-50/50' : 'bg-white'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-medium text-gray-500 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            {alert.time}
                                        </span>
                                    </div>
                                    {alert.category && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {alert.category}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-base font-semibold text-gray-900 mb-1">{alert.title || 'Alert'}</h4>
                                <p className="text-gray-700">{alert.description}</p>
                                {alert.details && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-600">{alert.details}</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => resolveAlert(alert.id)}
                                className="ml-3 inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                aria-label={`Resolve alert: ${alert.description}`}
                            >
                                Resolve
                                <svg className="ml-1 -mr-0.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
</div>
    );
};

export default Alerts;