const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT lost_items.id, lost_items.content, lost_items.created_at,
                    users.name AS poster_name
             FROM lost_items
             JOIN users ON lost_items.user_id = users.id
             ORDER BY lost_items.created_at DESC`
        );
        res.json({ posts: result.rows });
    } catch (error) {
        console.error("Error fetching lost items:", error);
        res.status(500).json({ message: "Server error." });
    }
});

router.post("/", async (req, res) => {
    try {
        const { user_id, content } = req.body;

        if (!user_id || !content || content.trim() === "") {
            return res.status(400).json({ message: "User ID and content are required." });
        }

        if (content.length > 5000) {
            return res.status(400).json({ message: "Post cannot exceed 5000 characters." });
        }

        const result = await pool.query(
            `INSERT INTO lost_items (user_id, content) VALUES ($1, $2) RETURNING id, content, created_at`,
            [user_id, content.trim()]
        );

        res.status(201).json({ post: result.rows[0] });
    } catch (error) {
        console.error("Error creating lost item post:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
