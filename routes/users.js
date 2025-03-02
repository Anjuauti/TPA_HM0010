const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({ message: 'Email already in use' });
    }
    
    // Create new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password, // Will be hashed in the pre-save hook
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
router.post('/login', async (req, res) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).send({ message: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await user.comparePassword(req.body.password);
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
router.get('/me', auth, async (req, res) => {
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
router.patch('/me', auth, async (req, res) => {
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

module.exports = router;