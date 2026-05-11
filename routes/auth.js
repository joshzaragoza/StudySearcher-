const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

// Signup a new user
router.post('/signup', async (req, res) => {
    try{
        const { name, uid, password } = req.body;

        if (!name || !uid || !password) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }

        if(!/^\d{9}$/.test(uid)) {
            return res.status(400).json({message: "UID must be exactly 9 digits."});
        }

    const existingUser = await pool.query(
        "SELECT * FROM users WHERE uid = $1",
        [uid]
    )

    if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "UID already has an existing account. Please log in instead or use a different UID." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //creating new user
    await pool.query(
        "INSERT INTO users (name, uid, password_hash) VALUES ($1, $2, $3)",
        [name, uid, hashedPassword]
    );
    
    return res.status(201).json({ message: "Account created successfully. Please log in." });
} catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "An error occurred during signup. Please try again later." });
}
});


// Login an existing user
router.post('/login', async (req, res) => {
    try {
        const { uid, password } = req.body;
        
        if (!uid || !password) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }

         if(!/^\d{9}$/.test(uid)) {
            return res.status(400).json({message: "UID must be exactly 9 digits."});
        }

        const userResult = await pool.query(
            "SELECT * FROM users WHERE uid = $1",
            [uid]
        );

        const user = userResult.rows[0];

        if(!user) {
            return res.status(400).json({ message: "Invalid UID or password." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(400).json({ message: "Invalid UID or password." });
        }

        return res.status(200).json({ message: `Login Successful!`, user: { name: user.name, uid: user.uid } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Login server error." });
    }
});

module.exports = router;
