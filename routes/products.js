const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Create new product listing
router.post('/', auth, async (req, res) => {
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
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.patch('/:id', auth, async (req, res) => {
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
router.delete('/:id', auth, async (req, res) => {
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

// Get Products Listed by the Current Seller
router.get('/seller', auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    res.send(products);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching seller products', error: error.message });
  }
});

module.exports = router;