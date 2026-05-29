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
                classes.code AS shared_class,
                myavailability.day_of_week,
                GREATEST(myavailability.start_time, theiravailability.start_time) AS shared_start_time,
                LEAST(myavailability.end_time, theiravailability.end_time) AS shared_end_time
            FROM users
            JOIN user_classes 
            ON users.id = user_classes.user_id
            JOIN classes 
            ON user_classes.class_id = classes.id
            JOIN availability AS myavailability
            ON myavailability.user_id = $1
            JOIN availability AS theiravailability 
            ON theiravailability.user_id = users.id
            AND theiravailability.day_of_week = myavailability.day_of_week
            AND theiravailability.start_time < myavailability.end_time
            AND theiravailability.end_time > myavailability.start_time
            WHERE user_classes.class_id IN (
                SELECT class_id
                FROM user_classes
                WHERE user_id = $1
            )
            AND users.id != $1
<<<<<<< Updated upstream
=======
            AND NOT EXISTS (
                SELECT 1
                FROM blocked_users
                WHERE 
                    (blocker_id = $1 AND blocked_id = users.id)
                    OR
                    (blocker_id = users.id AND blocked_id = $1)
            )
                    ORDER BY users.name, classes.code, myavailability.day_of_week, shared_start_time
>>>>>>> Stashed changes
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