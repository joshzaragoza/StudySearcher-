const express = require("express");
const router = express.Router();

// Create a new study ticket
router.post("/", async (req, res) => {
    // TODO: save ticket to database
    res.status(201).json({ message: "Ticket created." });
});

// Get all tickets visible to a user
router.get("/:userId", async (req, res) => {
    // TODO: fetch tickets from database
    res.json({ tickets: [] });
});

// Accept a ticket
router.post("/:ticketId/accept", async (req, res) => {
    // TODO: record acceptance and send auto DM
    res.json({ message: "Ticket accepted." });
});

module.exports = router;