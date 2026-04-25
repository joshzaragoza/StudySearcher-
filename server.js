const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const bcrypt = require('bcrypt');
const User = require('./userData/user');


app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
