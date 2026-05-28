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

// Routes for conversations, messages, and blocking users
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/block", require("./routes/block"));

// Start the server and set up Socket.IO for real-time messaging
const server = require("http").createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Scocket.IO connection handling. Listen for users joining conversations and sending messages
io.on("connection", (socket) => {
    console.log("A user connected:" + socket.id);

    // Listen for users joining a conversation room
    socket.on("join_conversation", async ({ conversationId, userId }) => {
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
            if (!conversationId || !senderId || !body?.trim()) {
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

            // Insert the new message into the database
            const newMessage = await pool.query(
                `
                INSERT INTO messages (conversation_id, sender_id, body)
                VALUES ($1, $2, $3)
                RETURNING id, conversation_id, sender_id, body, created_at
                `,
                [conversationId, senderId, body]
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