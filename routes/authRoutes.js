const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Simple login or auto-register
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
console.log(username, password)
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    let user = await User.findOne({ username });

    if (!user) {
         return res.status(401).json({ message: "Invalid user" });
    } else if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({ message: "Login successful", userId: user._id });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message:error.message ||  "Internal Server Error" });
  }
});

module.exports = router;
