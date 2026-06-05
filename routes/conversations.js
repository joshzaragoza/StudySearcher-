const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

const { isPositiveInteger } = require("../utils/validation");

// POST /api/conversations/open
// Takes in: currentUserId and otherUserId in the request body.
// Returns: the conversationId of the existing or newly created one-on-one conversation between the two users, or an error if a conversation cannot be opened (e.g. if either user has blocked the other).
router.post("/open", async (req, res) => {
    try {
        const { currentUserId, otherUserId } = req.body;

        // Validate user IDs
        if (!isPositiveInteger(currentUserId) || !isPositiveInteger(otherUserId)) {
            return res.status(400).json({ message: "Invalid user IDs." });
        }

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

// GET /api/conversations/:conversationId/other/:userId
// Takes in: conversationId and userId as req.params.
// Returns: the other user's id and name in the one-on-one conversation, or an error if the conversation doesn't exist, isn't a one-on-one, or the user isn't a member.
router.get("/:conversationId/other/:userId", async (req, res) => {
    try {
        const { conversationId, userId } = req.params;

        // Validate conversationId and userId
        if (!isPositiveInteger(conversationId) || !isPositiveInteger(userId)) {
            return res.status(400).json({ message: "Invalid conversation ID or user ID." });
        }

        // check if the user is a member of the conversation
        const memberCheck = await pool.query(
            `
            SELECT 1
            FROM conversation_members
            WHERE conversation_id = $1 AND user_id = $2
            `,
            [conversationId, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ message: "User is not a member of the conversation." });
        }
        
        // Get the other user's ID in the conversation
        const otherUserResult = await pool.query(
             `
              SELECT users.id, users.name
              FROM conversation_members
              JOIN users ON conversation_members.user_id = users.id
              JOIN conversations ON conversation_members.conversation_id = conversations.id
              WHERE conversation_members.conversation_id = $1
                AND conversation_members.user_id != $2
                AND conversations.is_group = false
              LIMIT 1
              `,
            [conversationId, userId]
        );

        if (otherUserResult.rows.length === 0) {
            return res.status(404).json({ message: "Other user not found." });
        }

        return res.json({ otherUser: otherUserResult.rows[0] });
    } catch (error) {
        console.error("Error fetching other user:", error);
        res.status(500).json({ message: "Server error." });
    }
});

// GET /api/conversations/:userId
// Takes in: userId as req.params.userId.
// Returns: a list of all one-on-one conversations the user is a member of, including each conversation's id and the other user's id and name, ordered by most recent conversation first.
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!isPositiveInteger(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Fetch all one-on-one conversations for the user, along with the other user's info
        
        const result = await pool.query(
        `
        SELECT
            conversations.id AS conversation_id,
            users.id AS other_user_id,
            users.name AS other_user_name,
            MAX(messages.created_at) AS last_message_at,
            COUNT(
            CASE
                WHEN messages.sender_id != $1
                AND (cm_self.last_read_at IS NULL
                    OR messages.created_at > cm_self.last_read_at)
                THEN 1
            END
            ) AS unread_count
        FROM conversations
        JOIN conversation_members cm_self
            ON conversations.id = cm_self.conversation_id
            AND cm_self.user_id = $1
        JOIN conversation_members other_member
            ON conversations.id = other_member.conversation_id
        JOIN users
            ON other_member.user_id = users.id
        LEFT JOIN messages
            ON messages.conversation_id = conversations.id
        WHERE cm_self.user_id = $1
            AND other_member.user_id != $1
            AND conversations.is_group = false
        GROUP BY conversations.id, users.id, users.name, cm_self.last_read_at
        ORDER BY last_message_at DESC NULLS LAST
        `,
        [userId]
        );
        res.json({ conversations: result.rows });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
