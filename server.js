require('dotenv').config();

const express = require('express');
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(express.json());
app.use(cors());

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGSSLMODE, PGCHANNELBINDING } = process.env;

const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE,
    user: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
        require: true,
        rejectUnauthorized: false
    }
});

app.get("/", async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM classes");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        // Release the client back to the pool
        client.release();
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});