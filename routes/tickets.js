const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.post("/send", async (req, res) => {
    try {
        const { conversation_id, sender_id, class_code, location, study_date, study_time } = req.body;

        const body = `Study Invite | ${class_code} | ${location} | ${study_date} at ${study_time} | TICKET`;

        await pool.query(
            "INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)",
            [conversation_id, sender_id, body]
        );

        return res.status(201).json({ message: "Ticket sent." });
    } catch (error) {
        console.error("Error sending ticket:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

router.post("/accept", async (req, res) => {
    try {
        const { conversation_id, acceptor_id, acceptor_name, class_code } = req.body;

        const body = `${acceptor_name} accepted the study session for ${class_code}.`;

        await pool.query(
            "INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)",
            [conversation_id, acceptor_id, body]
        );

        return res.json({ message: "Acceptance sent." });
    } catch (error) {
        console.error("Error accepting ticket:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;