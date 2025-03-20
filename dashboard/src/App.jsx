import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [users, setUsers] = useState(null); // null for loading state
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    axios.get("/api/users")
      .then((response) => {
        setUsers(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      });
  };

  useEffect(fetchUsers, []); // Fetch users on mount

  const handleAddUser = async () => {
    if (!name.trim()) return; // Prevent empty input

    try {
      await axios.post("/api/user/create", { name });
      setName(""); // Clear input field
      fetchUsers(); // Refetch users to update UI properly
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.post("/api/user/delete", { id: userId });
      fetchUsers(); // Refetch users after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleIncrementUser = async (userId) => {
    try {
      await axios.post("/api/user/increment", { id: userId });
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error incrementing user:", error);
    }
  };

  const handleDecrementUser = async (userId) => {
    try {
      await axios.post("/api/user/decrement", { id: userId });
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error decrementing user:", error);
    }
  };


  return (
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

      {/* Users List */}
      {loading ? (
        <p>Loading users...</p>
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
  );
};

export default App;
