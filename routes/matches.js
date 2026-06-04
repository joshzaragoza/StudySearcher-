const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

const { isPositiveInteger } = require("../utils/validation");

// GET /api/matches/shared/:userId/:otherUserId
// Takes in two user ids as route params
// Returns the classes that both users have in common
router.get("/shared/:userId/:otherUserId", async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;

        if (!isPositiveInteger(userId) || !isPositiveInteger(otherUserId)) {
            return res.status(400).json({ message: "Invalid user IDs." });
        }

        if (Number(userId) === Number(otherUserId)) {
            return res.status(400).json({ message: "Cannot compare a user with themself." });
        }

        const sharedClassesResult = await pool.query(
            `
            SELECT classes.code
            FROM user_classes current_user_classes
            JOIN user_classes other_user_classes
                ON current_user_classes.class_id = other_user_classes.class_id
            JOIN classes
                ON current_user_classes.class_id = classes.id
            WHERE current_user_classes.user_id = $1
                AND other_user_classes.user_id = $2
            ORDER BY classes.code
            `,
            [userId, otherUserId]
        );

        return res.json({
            sharedClasses: sharedClassesResult.rows.map((row) => row.code)
        });
    } catch (error) {
        console.error("Error fetching shared classes:", error);
        res.status(500).json({ message: "Server error." });
    }
});

// GET /api/matches/:id
// Takes in: user id as req.params.id.
// Returns: a list of matching users who share at least one class with the given user, excluding any users who have blocked or been blocked by the given user. Each match includes the matched user's id, name, uid, and one shared class code.
router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const useAvailability = req.query.availability === "true";

        let query;

            if(useAvailability) {
                query = `
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
            AND NOT EXISTS (
                SELECT 1
                FROM blocked_users
                WHERE 
                    (blocker_id = $1 AND blocked_id = users.id)
                    OR
                    (blocker_id = users.id AND blocked_id = $1)
            )
                    ORDER BY users.name, classes.code, myavailability.day_of_week, shared_start_time
            `;
            } else {
                query = `
            SELECT DISTINCT
                users.id,
                users.name,
                users.uid,
                classes.code AS shared_class
            FROM users
            JOIN user_classes 
            ON users.id = user_classes.user_id
            JOIN classes 
            ON user_classes.class_id = classes.id
            WHERE user_classes.class_id IN (
                SELECT class_id
                FROM user_classes
                WHERE user_id = $1
            )
            AND users.id != $1
            AND NOT EXISTS (
                SELECT 1
                FROM blocked_users
                WHERE 
                    (blocker_id = $1 AND blocked_id = users.id)
                    OR
                    (blocker_id = users.id AND blocked_id = $1)
            )
                    ORDER BY users.name, classes.code
            `;
            }

            const matchesResult = await pool.query(query, [userId]);

        res.json({ matches: matchesResult.rows });
        
    } catch (error) {
        console.error("Error finding matches:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
