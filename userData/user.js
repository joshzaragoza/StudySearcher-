const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true},
    password: { type: String, required: true },
    uid: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('User', userSchema);