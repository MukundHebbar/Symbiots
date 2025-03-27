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
    
    

    // Create alerts table
    await db.exec('CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY, type TEXT NOT NULL, location TEXT NOT NULL);');

await db.exec('CREATE TABLE IF NOT EXISTS rfid (rfid TEXT);');
    
    // Initialize the table with one empty row if it doesn't exist
    const rfidRow = await db.get('SELECT * FROM rfid');
    if (!rfidRow) {
        await db.run('INSERT INTO rfid (rfid) VALUES (?)', ['']);
    }

    // Endpoint to update RFID value
    app.put("/api/rfid", async (req, res) => {
        const { rfid } = req.body;
        if (!rfid) {
            return res.status(400).json({ error: "RFID value is required" });
        }
        try {
            // First update the rfid table
            await db.run('UPDATE rfid SET rfid = ?', [rfid]);
    
            // Check if this RFID exists in users table
            const user = await db.get('SELECT * FROM users WHERE rfid = ?', [rfid]);
            if (user) {
                // If exists, increment the quantity
                await db.run('UPDATE users SET Quantity = Quantity + 1 WHERE rfid = ?', [rfid]);
                return res.status(200).json({ 
                    message: "RFID value updated and quantity incremented",
                    updatedUser: user.name
                });
            }
    
            res.status(200).json({ message: "RFID value updated successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Add endpoints for alerts
    app.post("/api/alerts/create", async (req, res) => {
        const { type, location } = req.body;
        if (!type || !location) {
            return res.status(400).json({ error: "Type and location are required" });
        }
        try {
            await db.run('INSERT INTO alerts (type, location) VALUES (?, ?)', [type, location]);
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

    // ...existing endpoints...
    
    app.post("/api/items/create/:category", async (req, res) => {
        const { name } = req.body;
        const { category } = req.params;
        
        if (!name) {
            return res.status(400).json({ error: "Item name is required" });
        }
        
        try {
            // Get current RFID value
            const rfidData = await db.get('SELECT rfid FROM rfid LIMIT 1');
            if (!rfidData || !rfidData.rfid) {
                return res.status(400).json({ error: "No RFID value available" });
            }
    
            const item = await db.get('SELECT * FROM users WHERE name = ? AND type = ?', [name, category]);
            if (item) {
                await db.run('UPDATE users SET Quantity = Quantity + 1 WHERE id = ?', [item.id]);
            } else {
                await db.run('INSERT INTO users (name, Quantity, type, rfid) VALUES (?, ?, ?, ?)', 
                    [name, 1, category, rfidData.rfid]);
            }
            res.status(201).json({ message: `${category} item processed` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
    // Generic endpoint to fetch items by category
    app.get("/api/items/:category", async (req, res) => {
        const { category } = req.params;
        try {
            const items = await db.all('SELECT * FROM users WHERE type = ?', [category]);
            res.json(items);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
   
    app.post("/api/user/create", async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: "User name is required" });
    }
    try {
        // Get current RFID value
        const rfidData = await db.get('SELECT rfid FROM rfid LIMIT 1');
        if (!rfidData || !rfidData.rfid) {
            return res.status(400).json({ error: "No RFID value available" });
        }

        const user = await db.get('SELECT * FROM users WHERE name = ?', [name]);
        if (user) {
            await db.run('UPDATE users SET Quantity = Quantity + 1 WHERE id = ?', [user.id]);
        } else {
            await db.run('INSERT INTO users (name, Quantity, type, rfid) VALUES (?, ?, ?, ?)', 
                [name, 1, "User", rfidData.rfid]);
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

    // New endpoint to decrement user's quantity (won't decrement below 1)
    app.post("/api/user/decrement", async (req, res) => {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ error: "User id is required" });
        }
        try {
            await db.run(
                `UPDATE users 
                 SET Quantity = CASE 
                                   WHEN Quantity > 1 THEN Quantity - 1 
                                   ELSE 1 
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