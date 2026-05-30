const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

// POST /api/block
// Takes in: blockerId and blockedId in the request body.
// Returns: success message if the block was successful, or an error if the block cannot be performed (e.g. if blockerId and blockedId are the same).
// Side effect: any existing one-on-one conversations between the two users are deleted.
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
      const { blockerId, blockedId } = req.body;

      // Validate user IDs
      if (!isPositiveInteger(blockerId) || !isPositiveInteger(blockedId)) {
        return res.status(400).json({ message: "Invalid user IDs." });
      }

      // Prevent users from blocking themselves
      if (Number(blockerId) === Number(blockedId)) {
        return res.status(400).json({ message: "Cannot block yourself." });
      }

      await client.query("BEGIN");

      // Insert block record
      await client.query(
        "INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT (blocker_id, blocked_id) DO NOTHING",
        [blockerId, blockedId]
      );

      // Find any existing conversations between the two users
      const conversations = await client.query(
        `
        SELECT c.id
        FROM conversations c
        JOIN conversation_members cm1
          ON c.id = cm1.conversation_id
        JOIN conversation_members cm2
          ON c.id = cm2.conversation_id
        WHERE c.is_group = FALSE
          AND cm1.user_id = $1
          AND cm2.user_id = $2
        `,
        [blockerId, blockedId]
      );

      // Extract conversation IDs to delete
      const conversationIds = conversations.rows.map(row => Number(row.id));

      // Delete any conversations between the two users
      // MAKE SURE TO USE ANY() WITH A PARAMETERIZED QUERY TO AVOID SQL INJECTION
      // CAST TO int[] TO MATCH THE TYPE OF id
      if (conversationIds.length > 0) {
        await client.query(
          "DELETE FROM conversations WHERE id = ANY($1::int[])",
          [conversationIds]
        );
      }

      await client.query("COMMIT");
      
      return res.json({ message: "User blocked and conversations deleted if they existed." });
  } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error blocking user:", error);
      return res.status(500).json({ message: "Server error." });
  } finally {
      client.release();
  }   
});

module.exports = router;