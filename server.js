const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Tiryaq API is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Tiryaq backend working"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});