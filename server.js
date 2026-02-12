const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// health
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// register user
app.post("/api/users/register", (req, res) => {

  const { name, phone, location } = req.body;

  if (!name || !phone || !location) {
    return res.status(400).json({
      success: false,
      message: "Missing fields"
    });
  }

  const user = {
    id: Date.now().toString(),
    name,
    phone,
    location
  };

  res.json({
    success: true,
    user
  });

});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});