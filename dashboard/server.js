import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const dbPromise = open({
    filename: 'db.sqlite',
    driver: sqlite3.Database
});

(async () => {
    const db = await dbPromise;
    
    // Create users table (existing)
    await db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, Quantity INTEGER DEFAULT 1, type TEXT NOT NULL , rfid TEXT NOT NULL);');
    
    await db.exec('CREATE TABLE IF NOT EXISTS esp32 (type TEXT);');
    
    await db.exec('CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY Autoincrement, time TEXT NOT NULL, description TEXT NOT NULL);');

    // Initialize esp32 table with one empty row if it doesn't exist
    const esp32Row = await db.get('SELECT * FROM esp32');
    if (!esp32Row) {
        await db.run('INSERT INTO esp32 (type) VALUES (?)', ['']);
    }

    // Drop and recreate the RFID table with quantity field
    await db.exec('DROP TABLE IF EXISTS rfid');
    await db.exec('CREATE TABLE IF NOT EXISTS rfid (rfid TEXT, quantity INTEGER DEFAULT 1);');
    
    // Initialize the table with one empty row if it doesn't exist
    const rfidRow = await db.get('SELECT * FROM rfid');
    if (!rfidRow) {
        await db.run('INSERT INTO rfid (rfid, quantity) VALUES (?, ?)', ['', 1]);
    }

    // After the other table creation statements
    await db.exec('CREATE TABLE IF NOT EXISTS occupancy (count INTEGER DEFAULT 0);');

    // Initialize occupancy table with one row if it doesn't exist
    const occupancyRow = await db.get('SELECT * FROM occupancy');
    if (!occupancyRow) {
        await db.run('INSERT INTO occupancy (count) VALUES (?)', [0]);
    }

    // Add this with the other API endpoints
    app.get("/api/occupancy", async (req, res) => {
        try {
            const occupancyData = await db.get('SELECT count FROM occupancy');
            res.json(occupancyData);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Add this with the other API endpoints
    app.put("/api/occupancy", async (req, res) => {
        const { count } = req.body;
        
        if (count === undefined) {
            return res.status(400).json({ error: "Count value is required" });
        }
        
        // Ensure count is a non-negative integer
        const countValue = parseInt(count);
        if (isNaN(countValue) || countValue < 0) {
            return res.status(400).json({ error: "Count must be a non-negative integer" });
        }
        
        try {
            await db.run('UPDATE occupancy SET count = ?', [countValue]);
            res.status(200).json({ 
                message: "Occupancy count updated successfully",
                newCount: countValue
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get("/api/esp32", async (req, res) => {
        try {
            // Retrieve the current value from the esp32 table
            const esp32Data = await db.get('SELECT type FROM esp32');
            // "Flush" the table by resetting the type to an empty string
            await db.run("UPDATE esp32 SET type = ''");
            res.json(esp32Data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Modified endpoint to update RFID value with quantity
    app.put("/api/rfid", async (req, res) => {
        const { rfid, quantity } = req.body;
        if (!rfid) {
            return res.status(400).json({ error: "RFID value is required" });
        }
        
        // Use default quantity of 1 if not provided
        const quantityValue = quantity ? parseInt(quantity) : 1;
        
        try {
            // First update the rfid table with both rfid and quantity
            await db.run('UPDATE rfid SET rfid = ?, quantity = ?', [rfid, quantityValue]);
    
            // Check if this RFID exists in users table
            const user = await db.get('SELECT * FROM users WHERE rfid = ?', [rfid]);
            if (user) {
                // If exists, increment the quantity by the scanned quantity value
                await db.run(
                    'UPDATE users SET Quantity = Quantity + ? WHERE rfid = ?', 
                    [quantityValue, rfid]
                );
                
                // Update esp32 table with the user's type
                await db.run('UPDATE esp32 SET type = ?', [user.type]);
                
                return res.status(200).json({ 
                    message: "RFID value updated, quantity incremented, and ESP32 type updated",
                    updatedUser: user.name,
                    updatedType: user.type,
                    incrementedBy: quantityValue
                });
            }
    
            res.status(200).json({ 
                message: "RFID value and quantity updated successfully",
                quantity: quantityValue
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Add endpoints for alerts
    app.post("/api/alerts/create", async (req, res) => {
        const { description } = req.body; 
        const {id} = req.body;
        if (!description) {
            return res.status(400).json({ error: "Description is required" });
        }
        try {
            const time = new Date().toLocaleTimeString();
            await db.run('INSERT INTO alerts (id,time, description) VALUES (?,?, ?)', [id,time, description]);
            res.status(201).json({ message: "Alert created successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get("/api/alerts", async (req, res) => {
        try {
            const alerts = await db.all('SELECT * FROM alerts');
            res.json(alerts);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete("/api/alerts/:id", async (req, res) => {
        const { id } = req.params;
        try {
            await db.run('DELETE FROM alerts WHERE id = ?', [id]);
            res.status(200).json({ message: "Alert deleted successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
    // Modified endpoint to create items with quantity
    app.post("/api/items/create/:category", async (req, res) => {
        const { name } = req.body;
        const { category } = req.params;
        
        if (!name) {
            return res.status(400).json({ error: "Item name is required" });
        }
        
        try {
            // Get current RFID value and quantity
            const rfidData = await db.get('SELECT rfid, quantity FROM rfid LIMIT 1');
            if (!rfidData || !rfidData.rfid) {
                return res.status(400).json({ error: "No RFID value available" });
            }
    
            const item = await db.get('SELECT * FROM users WHERE name = ? AND type = ?', [name, category]);
            if (item) {
                // Add the quantity from RFID data (or 1 if not available)
                const incrementAmount = rfidData.quantity || 1;
                await db.run(
                    'UPDATE users SET Quantity = Quantity + ? WHERE id = ?', 
                    [incrementAmount, item.id]
                );
            } else {
                // Use the quantity from RFID data (or 1 if not available)
                const initialQuantity = rfidData.quantity || 1;
                await db.run(
                    'INSERT INTO users (name, Quantity, type, rfid) VALUES (?, ?, ?, ?)', 
                    [name, initialQuantity, category, rfidData.rfid]
                );
            }
            res.status(201).json({ message: `${category} item processed` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
    // Generic endpoint to fetch items by category - only returns items with quantity > 0
    app.get("/api/items/:category", async (req, res) => {
        const { category } = req.params;
        try {
            const items = await db.all(
                'SELECT * FROM users WHERE type = ? AND Quantity > 0', 
                [category]
            );
            res.json(items);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
   
    // Modified endpoint to create users with quantity
    app.post("/api/user/create", async (req, res) => {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "User name is required" });
        }
        try {
            // Get current RFID value and quantity
            const rfidData = await db.get('SELECT rfid, quantity FROM rfid LIMIT 1');
            if (!rfidData || !rfidData.rfid) {
                return res.status(400).json({ error: "No RFID value available" });
            }

            const user = await db.get('SELECT * FROM users WHERE name = ?', [name]);
            if (user) {
                // Add the quantity from RFID data (or 1 if not available)
                const incrementAmount = rfidData.quantity || 1;
                await db.run(
                    'UPDATE users SET Quantity = Quantity + ? WHERE id = ?', 
                    [incrementAmount, user.id]
                );
            } else {
                // Use the quantity from RFID data (or 1 if not available)
                const initialQuantity = rfidData.quantity || 1;
                await db.run(
                    'INSERT INTO users (name, Quantity, type, rfid) VALUES (?, ?, ?, ?)', 
                    [name, initialQuantity, "User", rfidData.rfid]
                );
            }
            res.status(201).json({ message: "User processed" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post("/api/user/delete", async (req, res) => {
        const { id } = req.body;
        try {
            await db.run('DELETE FROM users WHERE id = ?', [id]);
            res.status(201).json({ message: "User deleted" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // New endpoint to increment user's quantity
    app.post("/api/user/increment", async (req, res) => {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ error: "User id is required" });
        }
        try {
            await db.run('UPDATE users SET Quantity = Quantity + 1 WHERE id = ?', [id]);
            res.status(200).json({ message: "User quantity incremented" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Endpoint to decrement user's quantity (allows going to zero)
    app.post("/api/user/decrement", async (req, res) => {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ error: "User id is required" });
        }
        try {
            await db.run(
                `UPDATE users 
                SET Quantity = CASE 
                                WHEN Quantity > 0 THEN Quantity - 1 
                                ELSE 0 
                                END 
                WHERE id = ?`, [id]);
            res.status(200).json({ message: "User quantity decremented" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get("/api/users", async (req, res) => {
        try {
            const users = await db.all('SELECT * FROM users');
            res.json(users);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.listen(3000, () => console.log("Server running on port 3000"));
})();
