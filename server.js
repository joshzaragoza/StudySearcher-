const express = require('express');
const cors = require("cors");

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

app.listen(3000, () => {
    console.log("Server running on port 3000");
});