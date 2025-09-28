const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const MONGODBURL = process.env.MONGODB_SECRET;

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://procurementapp17589929.z29.web.core.windows.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect('mongodb://cosmos-procurement-db-1758948799:JelUvZBsxl8rfJIvaJM8n8aoeDZ8bmLz8eiZ9hm2TJfc9bF1dc3Os0sK1PKMG3zLE8D7O6PayFhKACDbFxPlvw==@cosmos-procurement-db-1758948799.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@cosmos-procurement-db-1758948799@', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'vendor', 'approver', 'admin'], default: 'buyer' },
  company: { type: String, required: true },
  isApproved: { type: Boolean, default: true },
//   isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// RFP/RFQ Schema
const rfpSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  requirements: [String],
  attachments: [String],
  status: { type: String, enum: ['draft', 'published', 'closed', 'awarded'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Quote Schema
const quoteSchema = new mongoose.Schema({
  rfpId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFP', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalPrice: { type: Number, required: true },
  deliveryTime: { type: Number, required: true }, // in days
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  terms: String,
  attachments: [String],
  status: { type: String, enum: ['submitted', 'under_review', 'accepted', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

// Purchase Order Schema
const purchaseOrderSchema = new mongoose.Schema({
  rfpId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFP', required: true },
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  poNumber: { type: String, unique: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  approvals: [{
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    comments: String,
    approvedAt: Date
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const RFP = mongoose.model('RFP', rfpSchema);
const Quote = mongoose.model('Quote', quoteSchema);
const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      company,
      isApproved: role === 'buyer' || role === 'admin'
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// RFP Routes
app.post('/api/rfps', authenticateToken, upload.array('attachments'), async (req, res) => {
  try {
    const { title, description, category, budget, deadline, requirements } = req.body;
    const attachments = req.files ? req.files.map(file => file.filename) : [];

    const rfp = new RFP({
      title,
      description,
      category,
      budget: parseFloat(budget),
      deadline: new Date(deadline),
      requirements: JSON.parse(requirements || '[]'),
      attachments,
      createdBy: req.user.userId
    });

    await rfp.save();
    res.status(201).json(rfp);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/rfps', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'buyer') {
      query.createdBy = req.user.userId;
    } else if (req.user.role === 'vendor') {
      query.status = 'published';
    }

    const rfps = await RFP.find(query)
      .populate('createdBy', 'name company')
      .sort({ createdAt: -1 });
    
    res.json(rfps);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/rfps/:id', authenticateToken, async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id).populate('createdBy', 'name company');
    if (!rfp) {
      return res.status(404).json({ message: 'RFP not found' });
    }
    res.json(rfp);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/rfps/:id/publish', authenticateToken, async (req, res) => {
  try {
    const rfp = await RFP.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { status: 'published' },
      { new: true }
    );
    
    if (!rfp) {
      return res.status(404).json({ message: 'RFP not found' });
    }
    
    res.json(rfp);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Quote Routes
app.post('/api/quotes', authenticateToken, upload.array('attachments'), async (req, res) => {
  try {
    const { rfpId, totalPrice, deliveryTime, items, terms } = req.body;
    const attachments = req.files ? req.files.map(file => file.filename) : [];

    const quote = new Quote({
      rfpId,
      vendorId: req.user.userId,
      totalPrice: parseFloat(totalPrice),
      deliveryTime: parseInt(deliveryTime),
      items: JSON.parse(items || '[]'),
      terms,
      attachments
    });

    await quote.save();
    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/quotes/rfp/:rfpId', authenticateToken, async (req, res) => {
  try {
    const quotes = await Quote.find({ rfpId: req.params.rfpId })
      .populate('vendorId', 'name company')
      .sort({ submittedAt: -1 });
    
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/quotes/vendor', authenticateToken, async (req, res) => {
  try {
    const quotes = await Quote.find({ vendorId: req.user.userId })
      .populate('rfpId', 'title category status')
      .sort({ submittedAt: -1 });
    
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Purchase Order Routes
app.post('/api/purchase-orders', authenticateToken, async (req, res) => {
  try {
    const { rfpId, quoteId, vendorId } = req.body;
    
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    const poNumber = 'PO' + Date.now();
    
    const purchaseOrder = new PurchaseOrder({
      rfpId,
      quoteId,
      vendorId,
      buyerId: req.user.userId,
      poNumber,
      totalAmount: quote.totalPrice,
      approvals: [{
        approver: req.user.userId,
        status: 'approved',
        approvedAt: new Date()
      }]
    });

    await purchaseOrder.save();
    
    // Update quote status
    await Quote.findByIdAndUpdate(quoteId, { status: 'accepted' });
    
    res.status(201).json(purchaseOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



app.get('/api/purchase-orders', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'buyer') {
      query.buyerId = req.user.userId;
    } else if (req.user.role === 'vendor') {
      query.vendorId = req.user.userId;
    }

    const orders = await PurchaseOrder.find(query)
      .populate('rfpId', 'title category')
      .populate('vendorId', 'name company')
      .populate('buyerId', 'name company')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/purchase-orders/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { status, comments } = req.body;
    
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Update order status
    order.status = status;
    
    // Add approval record
    order.approvals.push({
      approver: req.user.userId,
      status: status,
      comments: comments,
      approvedAt: new Date()
    });

    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Dashboard/Analytics Routes
// Enhanced dashboard stats route
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    let stats = {};
    
    if (req.user.role === 'buyer') {
      const totalRFPs = await RFP.countDocuments({ createdBy: req.user.userId });
      const activeRFPs = await RFP.countDocuments({ createdBy: req.user.userId, status: 'published' });
      const totalOrders = await PurchaseOrder.countDocuments({ buyerId: req.user.userId });
      const pendingOrders = await PurchaseOrder.countDocuments({ buyerId: req.user.userId, status: 'pending' });
      
      stats = { totalRFPs, activeRFPs, totalOrders, pendingOrders };
      
    } else if (req.user.role === 'vendor') {
      const totalQuotes = await Quote.countDocuments({ vendorId: req.user.userId });
      const acceptedQuotes = await Quote.countDocuments({ vendorId: req.user.userId, status: 'accepted' });
      const totalOrders = await PurchaseOrder.countDocuments({ vendorId: req.user.userId });
      const activeOrders = await PurchaseOrder.countDocuments({ vendorId: req.user.userId, status: 'approved' });
      
      stats = { totalQuotes, acceptedQuotes, totalOrders, activeOrders };
      
    } else if (req.user.role === 'approver') {
      const pendingApprovals = await PurchaseOrder.countDocuments({ status: 'pending' });
      
      // Get approved orders this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const approvedThisMonth = await PurchaseOrder.countDocuments({
        status: 'approved',
        updatedAt: { $gte: startOfMonth }
      });
      
      // Get total value of approved orders
      const approvedOrders = await PurchaseOrder.find({ status: 'approved' });
      const totalValueApproved = approvedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      // Calculate average approval time (mock data for now)
      const avgApprovalTime = 2.5; // You can calculate this from actual data
      
      stats = { pendingApprovals, approvedThisMonth, totalValueApproved, avgApprovalTime };
      
    } else if (req.user.role === 'admin') {
      const totalUsers = await User.countDocuments();
      const totalActiveRFPs = await RFP.countDocuments({ status: 'published' });
      const totalPendingApprovals = await PurchaseOrder.countDocuments({ status: 'pending' });
      
      // Calculate monthly volume
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthlyOrders = await PurchaseOrder.find({
        createdAt: { $gte: startOfMonth }
      });
      const monthlyVolume = monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      stats = { totalUsers, totalActiveRFPs, totalPendingApprovals, monthlyVolume };
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});