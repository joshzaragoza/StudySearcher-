const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.post("/open", async (req, res) => {
    try {
        const { currentUserId, otherUserId } = req.body;

        if (!currentUserId || !otherUserId) {
            return res.status(400).json({ message: "Missing currentUserId or otherUserId." });
        }

        if (Number(currentUserId) === Number(otherUserId)) {
            return res.status(400).json({ message: "Cannot open conversation with yourself." });
        }

        // Check if either user has blocked the other
        const blockCheck = await pool.query(
            `
            SELECT 1
            From blocked_users
            WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
            `,
            [currentUserId, otherUserId]
        );

        if (blockCheck.rows.length > 0) {
            return res.status(403).json({ message: "Cannot message blocked user." });
        }


        // Check if a conversation already exists between the two users
        // Selects the conversation ID of a one-on-one conversation that both users are members of, if it exists
        // Joins the conversation_members table twice to find a conversation where both users are members, and ensures it's not a group conversation
        // Limits to 1 result since we just need to know if any conversation exists
        const existingConversation = await pool.query(
            `
            SELECT cm1.conversation_id
            FROM conversation_members cm1
            JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
            JOIN conversations c ON cm1.conversation_id = c.id
            WHERE c.is_group = false
            AND cm1.user_id = $1
            AND cm2.user_id = $2
            LIMIT 1
            `,
            [currentUserId, otherUserId]
        );

        if (existingConversation.rows.length > 0) {
            return res.json({ conversationId: existingConversation.rows[0].conversation_id });
        }
        
        // If no conversation exists, create a new one
        const newConversation = await pool.query(
            `
            INSERT INTO conversations 
            DEFAULT VALUES
            RETURNING id
            `
        );
        
        const conversationId = newConversation.rows[0].id;

        // Add both users as members of the new conversation
        await pool.query(
            `
            INSERT INTO conversation_members (conversation_id, user_id)
            VALUES ($1, $2), ($1, $3)
            `,
            [conversationId, currentUserId, otherUserId]
        );

       return res.status(201).json({ conversationId });
    } catch (error) {
        console.error("Error opening conversation:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;