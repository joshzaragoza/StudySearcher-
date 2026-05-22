const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const matchesResult = await pool.query(
            `
            SELECT DISTINCT
                users.id,
                users.name,
                users.uid,
                classes.code AS shared_class
            FROM users
            JOIN user_classes ON users.id = user_classes.user_id
            JOIN classes ON user_classes.class_id = classes.id
            WHERE user_classes.class_id IN (
                SELECT class_id
                FROM user_classes
                WHERE user_id = $1
            )
            AND users.id != $1
            `,
            [userId]
        );

        res.json({ matches: matchesResult.rows });
    } catch (error) {
        console.error("Error finding matches:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;