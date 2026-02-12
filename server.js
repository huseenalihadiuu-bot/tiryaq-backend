const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/*
====================================
DATABASE (Temporary Memory Storage)
====================================
*/

let users = [];
let drivers = [];
let pharmacies = [];
let medicines = [];
let orders = [];

/*
====================================
HEALTH CHECK
====================================
*/

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Tiryaq backend working"
  });
});

/*
====================================
USER REGISTER
====================================
*/

app.post("/api/users/register", (req, res) => {

  const { name, phone, location } = req.body;

  if (!name  !phone  !location) {
    return res.status(400).json({
      success: false,
      message: "Missing fields"
    });
  }

  const user = {
    id: Date.now(),
    name,
    phone,
    location,
    createdAt: new Date()
  };

  users.push(user);

  res.json({
    success: true,
    user
  });

});

/*
====================================
DRIVER REGISTER
====================================
*/

app.post("/api/drivers/register", (req, res) => {

  const { name, phone, vehicleType } = req.body;

  if (!name  !phone  !vehicleType) {
    return res.status(400).json({
      success: false,
      message: "Missing fields"
    });
  }

  const driver = {
    id: Date.now(),
    name,
    phone,
    vehicleType,
    status: "offline",
    createdAt: new Date()
  };

  drivers.push(driver);

  res.json({
    success: true,
    driver
  });

});

/*
====================================
PHARMACY REGISTER
====================================
*/

app.post("/api/pharmacies/register", (req, res) => {

  const { name, location, workingHours } = req.body;

  if (!name  !location  !workingHours) {
    return res.status(400).json({
      success: false,
      message: "Missing fields"
    });
  }

  const pharmacy = {
    id: Date.now(),
    name,
    location,
    workingHours,
    medicines: [],
    createdAt: new Date()
  };

  pharmacies.push(pharmacy);

  res.json({
    success: true,
    pharmacy
  });

});

/*
====================================
ADD MEDICINE TO PHARMACY
====================================
*/

app.post("/api/medicines/add", (req, res) => {

  const { pharmacyId, name, description, price } = req.body;

  const pharmacy = pharmacies.find(p => p.id == pharmacyId);

  if (!pharmacy) {
    return res.status(404).json({
      success: false,
      message: "Pharmacy not found"
    });
  }

  const medicine = {
    id: Date.now(),
    pharmacyId,
    name,
    description,
    price
  };

  medicines.push(medicine);

  pharmacy.medicines.push(medicine);

  res.json({
    success: true,
    medicine
  });

});

/*
====================================
GET PHARMACIES
====================================
*/

app.get("/api/pharmacies", (req, res) => {
  res.json(pharmacies);
});

/*
====================================
GET DRIVERS
====================================
*/

app.get("/api/drivers", (req, res) => {
  res.json(drivers);
});

/*
====================================
CREATE ORDER
====================================
*/

app.post("/api/orders/create", (req, res) => {

  const { userId, pharmacyId, medicineId } = req.body;

  const order = {
    id: Date.now(),
    userId,
    pharmacyId,
    medicineId,
    status: "pending",
    createdAt: new Date()
  };

  orders.push(order);

  res.json({
    success: true,
    order
  });

});

/*
====================================
GET ORDERS
====================================
*/

app.get("/api/orders", (req, res) => {
  res.json(orders);
});

/*
====================================
START SERVER
====================================
*/

app.listen(PORT, () => {
  console.log(`Tiryaq server running on port ${PORT}`);
});