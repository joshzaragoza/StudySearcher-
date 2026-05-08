const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../userData/user');

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

    const existingUser = await User.findOne({ uid });

    if (existingUser) {
        return res.status(400).json({ message: "UID already has an existing account. Please log in instead or use a different UID." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //creating new user
    const newUser = new User({
        name,
        uid,
        password: hashedPassword
    });

    await newUser.save();
    
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

        const user = await User.findOne({ uid });

        if(!user) {
            return res.status(400).json({ message: "Invalid UID or password." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        
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
