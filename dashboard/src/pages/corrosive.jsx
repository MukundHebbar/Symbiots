import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../assets/header";
import '../App.css'
const Corrosive = () => {
  const [users, setUsers] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    axios.get("/api/items/corrosive")
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
        await axios.post("/api/items/create/corrosive", { name });
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
    <>  <Header/>
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Corrosive Items</h1>

      {/* Input Field */}
      <div className="flex gap-2 mb-4">
        <input
          className="border border-gray-600 bg-gray-800 text-white p-2 rounded"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter item name"
        />
        <button 
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          onClick={handleAddUser}
        >
          Add Item
        </button>
      </div>

      {/* Items List */}
      {loading ? (
        <p>Loading items...</p>
      ) : (
        <ul className="w-1/2 bg-gray-800 p-4 rounded-lg">
          {users.length === 0 ? (
            <p className="text-gray-400">No items found.</p>
          ) : (
            users.map((user) => (
              <li 
                key={user.id} 
                className="flex justify-between items-center p-2 border-b border-gray-600"
              >
                <span>{user.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
                    onClick={() => handleIncrementUser(user.id)}
                  >
                    +
                  </button>
                  <span>{user.Quantity}</span>
                  <button
                    className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
                    onClick={() => handleDecrementUser(user.id)}
                  >
                    -
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  </>);
};

export default Corrosive;