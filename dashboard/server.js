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

// Ensure table creation
(async () => {
    const db = await dbPromise;
    await db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);');
})();

app.post("/api/user/create", async (req, res) => {
    const { name } = req.body;
    try {
        const db = await dbPromise;
        await db.run('INSERT INTO users (name) VALUES (?)', [name]);
        res.status(201).json({ message: "User created" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/user/delete", async (req, res) => {
    const { id } = req.body;
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM users WHERE id=(?)', [id]);
        res.status(201).json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/users", async (req, res) => {
    try {
        const db = await dbPromise;
        const users = await db.all('SELECT * FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
