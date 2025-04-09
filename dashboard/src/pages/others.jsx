import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../assets/header";
import '../App.css'

const Others = () => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const fetchItems = () => {
    setLoading(true);
    setError(null);
    axios.get("/api/items/others")
      .then((response) => {
        setItems(response.data);
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setError("Failed to load items. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(fetchItems, []);

  const handleAddItem = async () => {
    if (!name.trim()) {
      setError("Please enter an item name");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/items/create/others", { name });
      setName("");
      setError(null);
      fetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
      setError("Failed to add item. Please try again.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    
    try {
      setLoading(true);
      await axios.post("/api/user/delete", { id: itemId });
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Failed to delete item. Please try again.");
    }
  };

  const handleQuantityChange = async (itemId, operation) => {
    try {
      const endpoint = operation === 'increment' 
        ? "/api/user/increment" 
        : "/api/user/decrement";
      
      await axios.post(endpoint, { id: itemId });
      fetchItems();
    } catch (error) {
      console.error(`Error ${operation}ing item:`, error);
      setError(`Failed to update quantity. Please try again.`);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditValue(item.Quantity.toString());
  };

  const handleEditChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setEditValue(value);
    }
  };

  const saveEdit = async (itemId) => {
    if (editValue === "") {
      setError("Please enter a quantity");
      return;
    }

    const newQuantity = parseInt(editValue);
    if (newQuantity < 0) {
      setError("Quantity cannot be negative");
      return;
    }

    try {
      await axios.post("/api/user/update-quantity", { 
        id: itemId, 
        quantity: newQuantity 
      });
      setEditingId(null);
      setEditValue("");
      fetchItems();
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError("Failed to update quantity. Please try again.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return ( 
    <>
      <Header/>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white/90 p-6 transition-all duration-200">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-wide text-amber-300 drop-shadow-lg">
            📦 Other Items 
        </h1>
        <div className="mb-6">
         
      </div>
        {/* Input Field */}
        <div className="w-full max-w-lg mb-6">
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              className="flex-1 border border-gray-700 bg-gray-800 text-white p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <button 
              className="bg-amber-600 hover:bg-amber-500 px-5 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2 text-black"
              onClick={handleAddItem}
            >
              <span>➕</span>
              <span>Add Item</span>
            </button>
          </div>
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
            <p className="text-gray-400">Loading items...</p>
          </div>
        ) : (
          <ul className="w-full max-w-lg bg-gray-800 p-4 md:p-5 rounded-xl shadow-lg border border-gray-700">
            {items?.length === 0 ? (
              <p className="text-gray-400 text-center text-lg py-4">No items found.</p>
            ) : (
              items?.map((item) => (
                <li 
                  key={item.id} 
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-700 rounded-lg mb-3 shadow-md hover:bg-gray-600 transition-all duration-200 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-lg truncate text-white" title={item.name}>{item.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={handleEditChange}
                          className="w-16 p-2 bg-gray-800 border border-gray-600 rounded text-center text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 bg-gray-600 px-3 py-1 rounded-full">
                          <button
                            className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-500 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleQuantityChange(item.id, 'decrement')}
                            aria-label="Decrease quantity"
                            disabled={item.Quantity <= 0}
                          >
                            −
                          </button>
                          <span 
                            className="min-w-8 text-center font-bold text-lg cursor-pointer hover:text-amber-300 text-white"
                            onClick={() => startEditing(item)}
                            title="Click to edit"
                          >
                            {item.Quantity}
                          </span>
                          <button
                            className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-500 transition-colors font-bold"
                            onClick={() => handleQuantityChange(item.id, 'increment')}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="bg-white hover:bg-gray-200 px-3 py-2 rounded-lg font-medium shadow-md transition-all duration-300 text-black flex items-center gap-2 flex-1 sm:flex-none justify-center"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <span className="text-black">🗑️</span>
                          <span className="hidden sm:inline text-black">Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </>
  );
};

export default Others;