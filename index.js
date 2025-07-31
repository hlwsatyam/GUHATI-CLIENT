const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const corse = require("cors");

const authRoutes = require("./routes/authRoutes.js");
const formRoutes = require("./routes/formRoutes.js");
const User = require("./models/User");

const app = express();
app.use(bodyParser.json());
app.use(corse());

// MongoDB Connection
mongoose.connect("mongodb+srv://HeySatyam:20172522Satyam@cluster0.xqoozjj.mongodb.net/GuhawatiClient?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"));







const createUser = async (username, password) => {
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      console.log("❌ User already exists");
      return;
    }

    const newUser = await User.create({ username, password });
    console.log("✅ User created:", newUser);
  } catch (err) {
    console.error("Error creating user:", err);
  }
};


//   createUser("admin@solar.com" , 'admin@123' )







// Routes
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);

// Start Server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
