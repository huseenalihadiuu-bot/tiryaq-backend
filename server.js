const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const users = [];
const pharmacies = [];
const drivers = [];
const orders = [];

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper for standard response
const success = (res, data) => res.json({ success: true, data });
const error = (res, message, status = 400) => res.status(status).json({ success: false, message });

// --- Routes ---

// 1. User Registration
app.post('/api/users/register', (req, res) => {
  const { name, phone, location } = req.body;
  
  if (!name || !phone || !location) {
    return error(res, 'Missing required fields: name, phone, location');
  }

  // Check if user already exists (optional, simply adding for now)
  const newUser = {
    id: generateId(),
    name,
    phone,
    location,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  console.log(`User registered: ${name}`);
  return success(res, newUser);
});

// 2. Pharmacy Registration
app.post('/api/pharmacies/register', (req, res) => {
  const { name, location, workingHours } = req.body;

  if (!name || !location || !workingHours) {
    return error(res, 'Missing required fields: name, location, workingHours');
  }

  // Add default medicines to every new pharmacy so the app is usable immediately
  const defaultMedicines = [
    { id: 'med_1', name: 'Paracetamol 500mg', description: 'Pain reliever and fever reducer', price: 5.00 },
    { id: 'med_2', name: 'Amoxicillin 250mg', description: 'Antibiotic for bacterial infections', price: 12.50 },
    { id: 'med_3', name: 'Vitamin C 1000mg', description: 'Immune system support supplement', price: 8.00 },
    { id: 'med_4', name: 'Ibuprofen 400mg', description: 'Anti-inflammatory pain relief', price: 6.50 },
    { id: 'med_5', name: 'Cough Syrup', description: 'Relief for dry and chesty coughs', price: 9.00 }
  ];

  const newPharmacy = {
    id: generateId(),
    name,
    location,
    workingHours,
    isOpen: true, // Default to open
    medicines: defaultMedicines,
    createdAt: new Date().toISOString()
  };

  pharmacies.push(newPharmacy);
  console.log(`Pharmacy registered: ${name}`);
  return success(res, newPharmacy);
});

// 3. Get Pharmacies
app.get('/api/pharmacies', (req, res) => {
  // Returns all registered pharmacies
  return success(res, pharmacies);
});

// 4. Driver Registration
app.post('/api/drivers/register', (req, res) => {
  const { name, phone, vehicleType } = req.body;

  if (!name || !phone || !vehicleType) {
    return error(res, 'Missing required fields: name, phone, vehicleType');
  }

  const newDriver = {
    id: generateId(),
    name,
    phone,
    vehicleType,
    status: 'available',
    createdAt: new Date().toISOString()
  };

  drivers.push(newDriver);
  console.log(`Driver registered: ${name}`);
  return success(res, newDriver);
});

// 5. Create Order
app.post('/api/orders/create', (req, res) => {
  const { userId, pharmacyId, medicineId, userPhone, userLocation } = req.body;

  if (!userId || !pharmacyId || !medicineId) {
    return error(res, 'Missing required fields');
  }

  const newOrder = {
    id: generateId(),
    userId,
    pharmacyId,
    medicineId,
    userPhone,
    userLocation,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  console.log(`Order created: ${newOrder.id}`);
  return success(res, newOrder);
});

// 6. Get Orders
app.get('/api/orders', (req, res) => {
  return success(res, orders);
});

// Root route
app.get('/', (req, res) => {
  res.send('Tiryaq Backend is Running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
