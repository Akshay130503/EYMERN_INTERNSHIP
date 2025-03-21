require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

const SECRET_KEY = process.env.SECRET_KEY || "my_super_secret_123!";

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/auctiondb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// Auction Item Schema
const auctionItemSchema = new mongoose.Schema({
  itemName: String,
  description: String,
  currentBid: Number,
  highestBidder: String,
  closingTime: Date,
  isClosed: { type: Boolean, default: false },
});
const AuctionItem = mongoose.model("AuctionItem", auctionItemSchema);

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
};

// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Signin Route
app.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ userId: user._id, username }, SECRET_KEY, {
        expiresIn: "1h",
      });
      res.json({ message: "Signin successful", token });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create Auction Item (Protected)
app.post("/auction", authenticate, async (req, res) => {
  try {
    const { itemName, description, startingBid, closingTime } = req.body;
    if (!itemName || !description || !startingBid || !closingTime) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newItem = new AuctionItem({
      itemName,
      description,
      currentBid: startingBid,
      highestBidder: "",
      closingTime,
    });
    await newItem.save();
    res.status(201).json({ message: "Auction item created", item: newItem });
  } catch (error) {
    console.error("Auction Post Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete Auction Item (Protected)
app.delete("/auction/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await AuctionItem.findByIdAndDelete(id);
    if (!deletedItem)
      return res.status(404).json({ message: "Auction not found" });
    res.json({ message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Delete Auction Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Edit Auction Item (Protected)
app.put("/auction/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedItem = await AuctionItem.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedItem)
      return res.status(404).json({ message: "Auction not found" });
    res.json({ message: "Auction updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Update Auction Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
