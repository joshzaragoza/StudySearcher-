const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.get("/:id/profile", async (req, res) => {
    try {
        const userId = req.params.id;

        const userResult = await pool.query(
            "SELECT id, uid, name FROM users WHERE id = $1",
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const classesResult = await pool.query(
            `
            SELECT classes.code
            FROM classes
            JOIN user_classes ON classes.id = user_classes.class_id
            WHERE user_classes.user_id = $1
            `,
            [userId]
        );

        const availability = await pool.query(
            `
            SELECT day_of_week, start_time, end_time
            FROM availability
            WHERE user_id = $1
            `,
            [userId]
        );

        res.json({
            user: userResult.rows[0],
            classes: classesResult.rows.map(row => row.code),
            availability: availability.rows
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;