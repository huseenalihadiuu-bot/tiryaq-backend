
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- Configuration ---
const PORT = process.env.PORT || 8080;
const RAILWAY_URL = 'https://tiryaq-backend-production.up.railway.app';
const JWT_SECRET = process.env.JWT_SECRET || 'tiryaq_secret_key_secure_123';

// --- Database Connection ---
// سيقوم الكود بإنشاء ملف قاعدة بيانات محلي (SQLite) في حال لم يتم توفير رابط Postgres
// لربطه بـ Railway Postgres، تأكد من وجود المتغير البيئي DATABASE_URL
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    });

// --- Models Definition ---

// 1. Users (يشمل المستخدم العادي، الصيدلية، السائق، والأدمن)
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('user', 'pharmacy', 'driver', 'admin'), 
    defaultValue: 'user' 
  },
  // Location Data
  lat: { type: DataTypes.FLOAT },
  lng: { type: DataTypes.FLOAT },
  address: { type: DataTypes.STRING },
  
  // Status
  isApproved: { type: DataTypes.BOOLEAN, defaultValue: false }, // للصيدليات والسائقين
  fcmToken: { type: DataTypes.STRING }, // للإشعارات
});

// 2. Pharmacy Details (بيانات إضافية للصيدليات)
const PharmacyMeta = sequelize.define('PharmacyMeta', {
  pharmacyName: { type: DataTypes.STRING },
  openingHours: { type: DataTypes.STRING },
  isOpen: { type: DataTypes.BOOLEAN, defaultValue: true },
  phone: { type: DataTypes.STRING }
});

// 3. Medicines (المخزون)
const Medicine = sequelize.define('Medicine', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  price: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  imageUrl: { type: DataTypes.STRING }
});

// 4. Orders (الطلبات)
const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  status: { 
    type: DataTypes.ENUM('pending', 'accepted', 'delivering', 'delivered', 'cancelled'), 
    defaultValue: 'pending' 
  },
  totalPrice: { type: DataTypes.FLOAT },
});

// 5. Complaints (الشكاوى)
const Complaint = sequelize.define('Complaint', {
  text: { type: DataTypes.TEXT, allowNull: false },
  senderName: { type: DataTypes.STRING }
});

// --- Relationships ---
User.hasOne(PharmacyMeta);
PharmacyMeta.belongsTo(User);

PharmacyMeta.hasMany(Medicine);
Medicine.belongsTo(PharmacyMeta);

// المستخدم يطلب طلب
User.hasMany(Order, { as: 'MyOrders', foreignKey: 'customerId' });
Order.belongsTo(User, { as: 'Customer', foreignKey: 'customerId' });

// السائق يوصل طلب
User.hasMany(Order, { as: 'Deliveries', foreignKey: 'driverId' });
Order.belongsTo(User, { as: 'Driver', foreignKey: 'driverId' });

// الطلب تابع لصيدلية
PharmacyMeta.hasMany(Order);
Order.belongsTo(PharmacyMeta);

User.hasMany(Complaint);
Complaint.belongsTo(User);

// --- Middleware ---

const app = express();
app.use(cors());
app.use(express.json());

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid Token' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// --- Routes ---

// 1. Auth & Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, lat, lng, pharmacyName, phone, vehicleType } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Auto approve normal users, others need admin approval
    const isApproved = role === 'user'; 

    const user = await User.create({
      name, email, password: hashedPassword, role, lat, lng, isApproved
    });

    if (role === 'pharmacy') {
      await PharmacyMeta.create({ 
        UserId: user.id, 
        pharmacyName: pharmacyName || `${name} Pharmacy`, 
        phone 
      });
    }

    // Generate Token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name, role, isApproved } });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'البريد أو كلمة المرور خطأ' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    
    // Fetch pharmacy meta if exists
    let extraData = {};
    if (user.role === 'pharmacy') {
      extraData = await PharmacyMeta.findOne({ where: { UserId: user.id } });
    }

    res.json({ token, user, extraData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Pharmacy Routes
app.get('/api/pharmacies', async (req, res) => {
  // Public: Get all approved pharmacies
  const pharmacies = await PharmacyMeta.findAll({
    include: [{ 
      model: User, 
      where: { isApproved: true },
      attributes: ['lat', 'lng', 'email']
    }]
  });
  res.json(pharmacies);
});

app.post('/api/pharmacies/medicine', authenticate, requireRole(['pharmacy']), async (req, res) => {
  try {
    const { name, stock, price } = req.body;
    const pharmacyMeta = await PharmacyMeta.findOne({ where: { UserId: req.user.id } });
    
    if (!pharmacyMeta) return res.status(404).json({ error: 'Pharmacy profile not found' });

    const medicine = await Medicine.create({
      name, stock, price, PharmacyMetumId: pharmacyMeta.id
    });
    res.json(medicine);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Orders & Drivers
app.post('/api/orders', authenticate, requireRole(['user']), async (req, res) => {
  // Create Order logic here
  // ...
  res.json({ message: 'Order created', orderId: 'mock-id' });
});

// 4. Complaints
app.post('/api/complaints', authenticate, async (req, res) => {
  await Complaint.create({
    text: req.body.text,
    senderName: req.body.senderName,
    UserId: req.user.id
  });
  res.json({ success: true });
});

// 5. Admin Routes
app.get('/api/admin/pending', authenticate, requireRole(['admin']), async (req, res) => {
  const pendingUsers = await User.findAll({ where: { isApproved: false } });
  res.json(pendingUsers);
});

app.post('/api/admin/approve', authenticate, requireRole(['admin']), async (req, res) => {
  const { userId } = req.body;
  await User.update({ isApproved: true }, { where: { id: userId } });
  res.json({ success: true });
});

// --- Server Initialization ---

const startServer = async () => {
  try {
    // Auto-create tables (sync)
    await sequelize.sync({ alter: true });
    console.log("✅ Database tables created/updated.");

    // Create Admin User if not exists
    const adminUser = await User.findOne({ where: { email: 'admin' } });
    if (!adminUser) {
      const adminPass = await bcrypt.hash('admin', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin',
        password: adminPass,
        role: 'admin',
        isApproved: true
      });
      console.log("👑 Admin account created: admin / admin");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Railway Backend: ${RAILWAY_URL}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();
