const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

// GET /api/messages/:conversationId
// Takes in: conversationId as req.params.conversationId.
// Returns: a list of messages for the given conversation, including each message's id, conversation_id, sender_id, sender_name, body, and created_at timestamp.
router.get("/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Validate conversationId
        if (!isPositiveInteger(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation ID." });
        }
        
        // Fetch messages for the given conversationId, along with sender's name
        const messagesResult = await pool.query(
            `
            SELECT m.id, m.conversation_id, m.sender_id, users.name AS sender_name, m.body, m.created_at
            FROM messages m
            JOIN users ON m.sender_id = users.id
            WHERE m.conversation_id = $1
            ORDER BY m.created_at ASC
            `,
            [conversationId]
        );

        res.json({ messages: messagesResult.rows });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;