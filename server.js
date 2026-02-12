const express = require("express");
const cors = require("cors");

const app = express();

// مهم لـ Railway
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

/*
==============================
Temporary Database
==============================
*/

const users = [];
const drivers = [];
const pharmacies = [];
const orders = [];

/*
==============================
Health Check
==============================
*/

app.get("/", (req, res) => {
  res.send("Tiryaq backend is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend working correctly"
  });
});

/*
==============================
USER REGISTER (FIXES YOUR ERROR)
==============================
*/

app.post("/api/users/register", (req, res) => {

  try {

    console.log("Incoming register request:", req.body);

    const { name, phone, location } = req.body;

    if (!name || !phone || !location) {

      return res.status(400).json({
        success: false,
        message: "Name, phone, and location are required"
      });

    }

    const newUser = {

      id: Date.now().toString(),
      name,
      phone,
      location,
      createdAt: new Date()

    };

    users.push(newUser);

    return res.status(201).json({

      success: true,
      message: "User registered successfully",
      user: newUser

    });

  } catch (error) {

    console.error("Register error:", error);

    return res.status(500).json({

      success: false,
      message: "Server error"

    });

  }

});

/*
==============================
GET USERS
==============================
*/

app.get("/api/users", (req, res) => {

  res.json({
    success: true,
    users
  });

});

/*
==============================
START SERVER
==============================
*/

app.listen(PORT, () => {

  console.log("==================================");
  console.log("Tiryaq Backend Started");
  console.log("PORT:", PORT);
  console.log("==================================");

});