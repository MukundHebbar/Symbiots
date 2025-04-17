import React, { useState, useEffect } from "react";
import axios from "axios";
import SensorDataDisplay from "../assets/thingspeak";

const Toxic = () => {
  const [users, setUsers] = useState([]); // Changed from null to empty array
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/items/toxic");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
      setError("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!name.trim()) return;

    try {
      await axios.post("/api/items/create/toxic", { name });
      setName("");
      await fetchUsers(); // Wait for refresh
    } catch (error) {
      console.error("Error adding item:", error);
      setError("Failed to add item. Please try again.");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.post("/api/user/delete", { id: userId });
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Failed to delete item. Please try again.");
    }
  };

  const handleIncrementUser = async (userId) => {
    try {
      await axios.post("/api/user/increment", { id: userId });
      await fetchUsers();
    } catch (error) {
      console.error("Error incrementing item:", error);
      setError("Failed to update quantity. Please try again.");
    }
  };

  const handleDecrementUser = async (userId) => {
    try {
      await axios.post("/api/user/decrement", { id: userId });
      await fetchUsers();
    } catch (error) {
      console.error("Error decrementing item:", error);
      setError("Failed to update quantity. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white/90 p-6 transition-all duration-200">
      {/* Title */}
      <h1 className="text-4xl font-extrabold mb-6 tracking-wide text-blue-300 drop-shadow-lg">
        ❄️ Cold Chain Items
      </h1>

      {/* Sensor Display */}
      <div className="mb-6 grid grid-cols-2 gap-4 w-full max-w-4xl">
        <SensorDataDisplay fieldNumber={1} />
        <SensorDataDisplay fieldNumber={2} />
      </div>

      {/* Input Field */}
      <div className="flex gap-3 mb-6 w-full max-w-lg">
        <input
          className="flex-1 border border-gray-600 bg-gray-800 text-white p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter item name"
          onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
        />
        <button
          className="bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 px-5 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 whitespace-nowrap"
          onClick={handleAddUser}
          disabled={loading}
        >
          {loading ? 'Adding...' : '+ Add Item'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg w-full max-w-lg text-center">
          {error}
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="w-full max-w-lg flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <ul className="w-full max-w-lg bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          {users.length === 0 ? (
            <p className="text-gray-400 text-center text-lg py-4">No items found.</p>
          ) : (
            users.map((user) => (
              <li
                key={user.id}
                className="flex justify-between items-center p-3 bg-gray-700 rounded-lg mb-3 shadow-md hover:bg-gray-600 transition-all duration-200"
              >
                <span className="font-medium text-lg truncate max-w-[180px]">{user.name}</span>
                <div className="flex items-center gap-3">
                  <button
                    className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-500 transition-colors font-bold disabled:opacity-50"
                    onClick={() => handleDecrementUser(user.id)}
                    disabled={user.Quantity <= 0}
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold min-w-[20px] text-center">
                    {user.Quantity}
                  </span>
                  <button
                    className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-500 transition-colors font-bold"
                    onClick={() => handleIncrementUser(user.id)}
                  >
                    +
                  </button>
                  <button
                    className="bg-white hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium shadow-md transition-all duration-300 text-black flex items-center gap-2"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default Toxic;