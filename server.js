const express = require('express');
const cors = require("cors");

const { Server } = require("socket.io");

const pool = require("./db/pool");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/matches", require("./routes/matches"));
app.use("/api/lost-found", require("./routes/lostFound"));

// Routes for conversations, messages, and blocking users
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/block", require("./routes/block"));
app.use("/api/tickets", require("./routes/tickets"));

// Start the server and set up Socket.IO for real-time messaging
const server = require("http").createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Helper function to validate that a value is a positive integer
const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

// Scocket.IO connection handling. Listen for users joining conversations and sending messages
io.on("connection", (socket) => {
    console.log("A user connected:" + socket.id);

    // Listen for users joining a conversation room
    socket.on("join_conversation", async ({ conversationId, userId }) => {
        // Validate conversationId and userId
        if (!isPositiveInteger(conversationId) || !isPositiveInteger(userId)) {
            console.warn("Invalid conversation ID or user ID");
            return;
        }

       // Confirm that the user is a member of the conversation before allowing them to join the room
        const memberCheck = await pool.query(
            `
            SELECT 1
            FROM conversation_members
            WHERE conversation_id = $1 AND user_id = $2
            `,
            [conversationId, userId]
        );

        if (memberCheck.rows.length === 0) {
            console.warn(`User ${userId} is not a member of conversation ${conversationId}`);
            return;
        }

        // Join the socket.io room for the conversation
        socket.join(`conversation_${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    // Listen for messages being sent in a conversation
    socket.on("send_message", async ({ conversationId, senderId, body }) => {
        try {
            // Validate message data
            if (!isPositiveInteger(conversationId) || !isPositiveInteger(senderId) || typeof body !== "string" || body.trim() === "") {
                console.warn("Invalid message data");
                return;
            }

            // Confirm that the sender is a member of the conversation before allowing them to send a message
            const memberCheck = await pool.query(
                `
                SELECT 1
                FROM conversation_members
                WHERE conversation_id = $1 AND user_id = $2
                `,
                [conversationId, senderId]
            );

            // If the sender is not a member of the conversation, do not allow them to send a message
            if (memberCheck.rows.length === 0) {
                console.warn(`User ${senderId} is not a member of conversation ${conversationId}`);
                return;
            }

            // format:
            // {
            //     id: 123,
            //     conversation_id: 456,
            //     sender_id: 789,
            //     sender_name: "Alice",
            //     body: "Hello, world!",
            //     created_at: "2024-06-01T12:34:56.789Z"
            // }
            const newMessage = await pool.query(
                `
                WITH inserted_message AS (
                    INSERT INTO messages (conversation_id, sender_id, body)
                    VALUES ($1, $2, $3)
                    RETURNING id, conversation_id, sender_id, body, created_at
                )
                SELECT 
                    inserted_message.id,
                    inserted_message.conversation_id,
                    inserted_message.sender_id,
                    users.name AS sender_name,
                    inserted_message.body,
                    inserted_message.created_at
                FROM inserted_message
                JOIN users ON inserted_message.sender_id = users.id
                `,
                [conversationId, senderId, body.trim()]
            );

            // Emit the new message to all users in the conversation room
            const messageData = newMessage.rows[0];
            io.to(`conversation_${conversationId}`).emit("new_message", messageData);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
    });
});
server.listen(3000, () => {
    console.log("Server running on port 3000");
});