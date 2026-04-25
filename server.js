const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const bycrypt = require('bcrypt');
const User = require('./userData/user');


app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});

