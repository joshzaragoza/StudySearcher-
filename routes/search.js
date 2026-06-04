const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length === 0) {
            return res.status(400).json({ message: "Search query is required." });
        }

        const searchTerm = `%${q.trim()}%`;

        const result = await pool.query(
            `SELECT DISTINCT users.id, users.name, users.uid, classes.code AS matched_class
            FROM users
            LEFT JOIN user_classes ON users.id = user_classes.user_id
            LEFT JOIN classes ON user_classes.class_id = classes.id
            WHERE users.name ILIKE $1 OR classes.code ILIKE $1
            ORDER BY users.name
            LIMIT 20`,
            [searchTerm]
        );

        return res.json({ results: result.rows });
    } catch (error) {
        console.error("Error searching:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;