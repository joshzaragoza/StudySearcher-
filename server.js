require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use('/', authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(3000, () => {
      console.log("Backend running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.log("MongoDB error:", err);
  });