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
            SELECT classes.code, user_classes.professor
            FROM classes
            JOIN user_classes ON classes.id = user_classes.class_id
            WHERE user_classes.user_id = $1
            ORDER BY classes.code
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
            classes: classesResult.rows,
            availability: availability.rows
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error." });
    }
});

router.post("/:id/classes", async (req, res) => {
    try {
        const userId = req.params.id;
        const { classes } = req.body;

        await pool.query(
            "DELETE FROM user_classes WHERE user_id = $1",
            [userId]
        );

        for (const code of classes) {
            const classResult = await pool.query(
                "INSERT INTO classes (code) VALUES ($1) ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code RETURNING id",
                [code]
            );
            const classId = classResult.rows[0].id;

            await pool.query(
                "INSERT INTO user_classes (user_id, class_id) VALUES ($1, $2)",
                [userId, classId]
            );
        }

        return res.status(200).json({ message: "Classes saved successfully." });
    } catch (error) {
        console.error("Error saving classes:", error);
        res.status(500).json({ message: "Server error." });
    }
});

router.post("/:id/availability", async (req, res) => {
    try {
        const userId = req.params.id;
        const { availability } = req.body;

        await pool.query(
            "DELETE FROM availability WHERE user_id = $1",
            [userId]
        );

        for (const slot of availability) {
            const { day_of_week, start_time, end_time } = slot;
            if (day_of_week && start_time && end_time) {
                await pool.query(
                    "INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)",
                    [userId, day_of_week, start_time, end_time]
                );
            }
        }

        return res.status(200).json({ message: "Availability saved successfully." });
    } catch (error) {
        console.error("Error saving availability:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;