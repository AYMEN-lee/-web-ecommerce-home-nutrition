require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve uploaded product images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve the frontend
app.use(express.static(path.join(__dirname, "homenutrition")));

// API routes
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/admin", require("./routes/admin"));

// Catch-all: serve frontend for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "homenutrition", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Home Nutrition server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin/`);
});
