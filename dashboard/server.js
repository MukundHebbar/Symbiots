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
    
    // Create table if not exists (for new databases)
    await db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, Quantity INTEGER DEFAULT 1, type TEXT NOT NULL , rfid INTEGER);');
    
    // If the table already exists, check if the Quantity column is present.
    const columns = await db.all("PRAGMA table_info(users)");
    const quantityExists = columns.some(col => col.name === "Quantity");
    if (!quantityExists) {
        // Add the Quantity column to the existing table.
        await db.exec('ALTER TABLE users ADD COLUMN Quantity INTEGER DEFAULT 1;');
    }
    
   
    
    app.post("/api/items/create/:category", async (req, res) => {
        const { name } = req.body;
        const { category } = req.params;
        
        if (!name) {
            return res.status(400).json({ error: "Item name is required" });
        }
        
        try {
            const item = await db.get('SELECT * FROM users WHERE name = ? AND type = ?', [name, category]);
            if (item) {
                await db.run('UPDATE users SET Quantity = Quantity + 1 WHERE id = ?', [item.id]);
            } else {
                await db.run('INSERT INTO users (name, Quantity, type) VALUES (?, ?, ?)', [name, 1, category]);
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
            const user = await db.get('SELECT * FROM users WHERE name = ?', [name]);
            if (user) {
                await db.run('UPDATE users SET Quantity = Quantity + 1 WHERE id = ?', [user.id]);
            } else {
                await db.run('INSERT INTO users (name, Quantity, type) VALUES (?, ?, ?)', [name, 1, "Nigga"]);
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