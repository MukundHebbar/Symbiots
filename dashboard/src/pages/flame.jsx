import React, { useState, useEffect } from "react";
import axios from "axios";
import SensorDataDisplay from "../assets/thingspeak"; // Make sure the path is correct
const Flame = () => {
  const [users, setUsers] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    axios.get("/api/items/flame")
        .then((response) => {
            setUsers(response.data);
            setLoading(false);
        })
        .catch((error) => {
            console.error("Error fetching items:", error);
            setLoading(false);
        });
  };

  useEffect(fetchUsers, []); // Fetch items on mount

  const handleAddUser = async () => {
    if (!name.trim()) return;

    try {
        await axios.post("/api/items/create/flame", { name });
        setName("");
        fetchUsers();
    } catch (error) {
        console.error("Error adding item:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.post("/api/user/delete", { id: userId });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleIncrementUser = async (userId) => {
    try {
      await axios.post("/api/user/increment", { id: userId });
      fetchUsers();
    } catch (error) {
      console.error("Error incrementing item:", error);
    }
  };

  const handleDecrementUser = async (userId) => {
    try {
      await axios.post("/api/user/decrement", { id: userId });
      fetchUsers();
    } catch (error) {
      console.error("Error decrementing item:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white/90 p-6 transition-all duration-200">
    {/* Title */}
    <h1 className="text-4xl font-extrabold mb-6 tracking-wide text-red-400">🔥 Flammable Items</h1>

    <div className="mb-6">
        <SensorDataDisplay fieldNumber={1} />
      </div>
    {/* Input Field */}
    <div className="flex gap-3 mb-6">
        
        <input
            className="border border-gray-700 bg-gray-800 text-white p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter item name"
        />
        <button 
              className="bg-red-600 hover:bg-red-400 px-5 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2 text-black"
              onClick={handleAddUser}
            >
              <span>➕</span>
              <span>Add Item</span>
            </button>
    </div>

    {/* Items List */}
    {loading ? (
        <p className="text-lg font-semibold text-gray-400 animate-pulse">Loading items...</p>
    ) : (
        <ul className="w-full max-w-lg bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
            {users.length === 0 ? (
                <p className="text-gray-400 text-center text-lg">No items found.</p>
            ) : (
                users.map((user) => (
                    <li 
                        key={user.id} 
                        className="flex justify-between items-center p-3 bg-gray-700 rounded-lg mb-3 shadow-md hover:bg-gray-600 transition-all duration-200"
                    >
                        <span className="font-medium text-lg">{user.name}</span>
                        <div className="flex items-center gap-3">
                            <button
                                className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-500 transition-colors font-bold"
                                onClick={() => handleIncrementUser(user.id)}
                            >
                                +
                            </button>
                            <span className="text-lg font-semibold">{user.Quantity}</span>
                            <button
                                className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-500 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleDecrementUser(user.id)}
                            >
                                −
                            </button>
                            <button
                                className="bg-white hover:bg-gray-200 px-3 py-2 rounded-lg font-medium shadow-md transition-all duration-300 text-black flex items-center gap-2 flex-1 sm:flex-none justify-center"
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

export default Flame;