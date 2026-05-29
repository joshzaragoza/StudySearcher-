const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

router.get("/:id/profile", async (req, res) => {
    try {
        const userId = req.params.id;

        // Validate userId if pos or not
        if (!isPositiveInteger(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Fetch user info
        const userResult = await pool.query(
            "SELECT id, uid, name FROM users WHERE id = $1",
            [userId]
        );

        // Check if user exists
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        // Fetch user's classes and professors
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

        // Fetch user's availability
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

        // Validate userId if pos or not
        if (!isPositiveInteger(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Validate classes input
        if (!Array.isArray(classes)) {
            return res.status(400).json({ message: "Classes must be an array." });
        }

        // Delete existing classes for the user before inserting new ones
        // since we are inserting all classes at once, this simplifies the logic and ensures we don't have duplicates
        await pool.query(
            "DELETE FROM user_classes WHERE user_id = $1",
            [userId]
        );

        // Insert new classes and professors for the user
        for (const item of classes) {
            // cleans the code and professor inputs, and also validates that they exist before trying to insert into the database   
            const code = item.code ? item.code.trim().toUpperCase() : undefined;
            const professor = item.professor ? item.professor.trim() : undefined;
            
            if (!code || !professor) {
                return res.status(400).json({
                    message: "Each class must include a code and professor."
                });
            }

            // Insert class if it doesn't exist, and get the class ID
            const classResult = await pool.query(
                "INSERT INTO classes (code) VALUES ($1) ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code RETURNING id",
                [code]
            );
            const classId = classResult.rows[0].id;

            // Insert into user_classes
            await pool.query(
                "INSERT INTO user_classes (user_id, class_id, professor) VALUES ($1, $2, $3)",
                [userId, classId, professor]
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

        if (!isPositiveInteger(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Delete existing availability for the user before inserting new ones
        await pool.query(
            "DELETE FROM availability WHERE user_id = $1",
            [userId]
        );

        // Validate availability input
        if (!Array.isArray(availability)) {
            return res.status(400).json({ message: "Availability must be an array." });
        }

        // Insert new availability slots for the user
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