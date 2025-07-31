const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String, // You should hash this in production
});

module.exports = mongoose.model("User", userSchema);
