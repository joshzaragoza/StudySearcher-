const express = require('express');
const cors = require("cors");

const http = require("http");
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

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_conversation", async ({ conversationId, userId }) => {
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

        socket.join(`conversation_${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on("send_message", async ({ conversationId, senderId, body }) => {
        try {
            if (!conversationId || !senderId || !body?.trim()) {
                console.warn("Invalid message data");
                return;
            }
            const memberCheck = await pool.query(
                `
                SELECT 1
                FROM conversation_members
                WHERE conversation_id = $1 AND user_id = $2
                `,
                [conversationId, senderId]
            );

            if (memberCheck.rows.length === 0) {
                console.warn(`User ${senderId} is not a member of conversation ${conversationId}`);
                return;
            }

            const newMessage = await pool.query(
                `
                INSERT INTO messages (conversation_id, sender_id, body)
                VALUES ($1, $2, $3)
                RETURNING id, conversation_id, sender_id, body, created_at
                `,
                [conversationId, senderId, body]
            );

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