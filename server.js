const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_exchange', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Define schemas
// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['buyer', 'seller', 'both'], required: true },
  createdAt: { type: Date, default: Date.now },
  profileImage: { type: String },
  college: { type: String },
  contactNumber: { type: String }
});

// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['textbooks', 'stationery', 'electronics', 'lab_equipment', 'notes', 'other'],
    required: true 
  },
  condition: { 
    type: String, 
    enum: ['new', 'like_new', 'good', 'fair', 'poor'],
    required: true 
  },
  images: [{ type: String }],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listed: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['available', 'sold', 'reserved'],
    default: 'available'
  },
  location: { type: String },
  views: { type: Number, default: 0 }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  meetupLocation: { type: String },
  meetupTime: { type: Date }
});

// Create models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Routes
// User Registration
app.post('/api/users/register', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({ message: 'Email already in use' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    // Create new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      userType: req.body.userType
    });
    
    await user.save();
    
    // Create token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).send({ 
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    res.status(500).send({ message: 'Error registering user', error: error.message });
  }
});

// User Login
app.post('/api/users/login', async (req, res) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).send({ message: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).send({ message: 'Invalid email or password' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(200).send({ 
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    res.status(500).send({ message: 'Error logging in', error: error.message });
  }
});

// Get user profile
app.get('/api/users/me', auth, async (req, res) => {
  try {
    res.send({ 
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        userType: req.user.userType,
        profileImage: req.user.profileImage,
        college: req.user.college,
        contactNumber: req.user.contactNumber
      }
    });
  } catch (error) {
    res.status(500).send({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
app.patch('/api/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'college', 'contactNumber', 'profileImage'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  
  if (!isValidOperation) {
    return res.status(400).send({ message: 'Invalid updates' });
  }
  
  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    
    res.send({ 
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        userType: req.user.userType,
        profileImage: req.user.profileImage,
        college: req.user.college,
        contactNumber: req.user.contactNumber
      }
    });
  } catch (error) {
    res.status(500).send({ message: 'Error updating profile', error: error.message });
  }
});

// Product routes
// Create new product listing
app.post('/api/products', auth, async (req, res) => {
  try {
    // Check if user is a seller or both
    if (req.user.userType !== 'seller' && req.user.userType !== 'both') {
      return res.status(403).send({ message: 'Only sellers can list products' });
    }
    
    const product = new Product({
      ...req.body,
      seller: req.user._id
    });
    
    await product.save();
    
    res.status(201).send({ 
      message: 'Product listed successfully',
      product
    });
  } catch (error) {
    res.status(500).send({ message: 'Error listing product', error: error.message });
  }
});

// Get all products with filters
app.get('/api/products', async (req, res) => {
  try {
    const match = {};
    
    // Add filters
    if (req.query.category) {
      match.category = req.query.category;
    }
    
    if (req.query.condition) {
      match.condition = req.query.condition;
    }
    
    if (req.query.minPrice && req.query.maxPrice) {
      match.price = { $gte: req.query.minPrice, $lte: req.query.maxPrice };
    } else if (req.query.minPrice) {
      match.price = { $gte: req.query.minPrice };
    } else if (req.query.maxPrice) {
      match.price = { $lte: req.query.maxPrice };
    }
    
    // Search by title/description
    if (req.query.search) {
      match.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Only show available products by default
    if (!req.query.status) {
      match.status = 'available';
    } else {
      match.status = req.query.status;
    }
    
    // Sort options
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      // Default sort by newest
      sort.listed = -1;
    }
    
    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    
    const products = await Product.find(match)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('seller', 'name college');
      
    res.send(products);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching products', error: error.message });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email college contactNumber');
      
    if (!product) {
      return res.status(404).send({ message: 'Product not found' });
    }
    
    // Increment view count
    product.views += 1;
    await product.save();
    
    res.send(product);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching product', error: error.message });
  }
});

// Update product
app.patch('/api/products/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['title', 'description', 'price', 'category', 'condition', 'images', 'status', 'location'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  
  if (!isValidOperation) {
    return res.status(400).send({ message: 'Invalid updates' });
  }
  
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).send({ message: 'Product not found or you are not the seller' });
    }
    
    updates.forEach(update => product[update] = req.body[update]);
    await product.save();
    
    res.send({ 
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).send({ message: 'Error updating product', error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).send({ message: 'Product not found or you are not the seller' });
    }
    
    res.send({ 
      message: 'Product deleted successfully',
      product
    });
  } catch (error) {
    res.status(500).send({ message: 'Error deleting product', error: error.message });
  }
});

// Order routes
// Create new order
app.post('/api/orders', auth, async (req, res) => {
  try {
    // Check if user is a buyer or both
    if (req.user.userType !== 'buyer' && req.user.userType !== 'both') {
      return res.status(403).send({ message: 'Only buyers can place orders' });
    }
    
    // Get product details
    const product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).send({ message: 'Product not found' });
    }
    
    // Check if product is available
    if (product.status !== 'available') {
      return res.status(400).send({ message: 'This product is no longer available' });
    }
    
    // Create order
    const order = new Order({
      buyer: req.user._id,
      seller: product.seller,
      product: product._id,
      price: product.price,
      meetupLocation: req.body.meetupLocation,
      meetupTime: req.body.meetupTime
    });
    
    await order.save();
    
    // Update product status to reserved
    product.status = 'reserved';
    await product.save();
    
    res.status(201).send({ 
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    res.status(500).send({ message: 'Error placing order', error: error.message });
  }
});

// Get buyer's orders
app.get('/api/orders/buyer', auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('product')
      .populate('seller', 'name email');
      
    res.send(orders);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching orders', error: error.message });
  }
});

// Get seller's orders
app.get('/api/orders/seller', auth, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate('product')
      .populate('buyer', 'name email');
      
    res.send(orders);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching orders', error: error.message });
  }
});

// Update order status
app.patch('/api/orders/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }
    
    // Check if user is either the buyer or seller of this order
    if (!order.buyer.equals(req.user._id) && !order.seller.equals(req.user._id)) {
      return res.status(403).send({ message: 'You are not authorized to update this order' });
    }
    
    // Update status
    order.status = req.body.status;
    await order.save();
    
    // If order is completed, update product status to sold
    if (req.body.status === 'completed') {
      const product = await Product.findById(order.product);
      product.status = 'sold';
      await product.save();
    }
    
    // If order is cancelled, update product status back to available
    if (req.body.status === 'cancelled') {
      const product = await Product.findById(order.product);
      product.status = 'available';
      await product.save();
    }
    
    res.send({ 
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    res.status(500).send({ message: 'Error updating order', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
