const express = require('express');
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/matches", require("./routes/matches"));
app.use("/api/lost-found", require("./routes/lostFound"));

app.listen(3000, () => {
    console.log("Server running on port 3000");
});