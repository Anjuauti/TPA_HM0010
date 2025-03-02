const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const router = express.Router();

// Create new order
router.post('/', auth, async (req, res) => {
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
router.get('/buyer', auth, async (req, res) => {
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
router.get('/seller', auth, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate('product')
      .populate('buyer', 'name email');
      
    res.send(orders);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching orders', error: error.message });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');
    
    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }
    
    // Check if user is either the buyer or seller of this order
    if (!order.buyer.equals(req.user._id) && !order.seller.equals(req.user._id)) {
      return res.status(403).send({ message: 'You are not authorized to view this order' });
    }
    
    res.send(order);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching order', error: error.message });
  }
});

// Update order status
router.patch('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }
    
    // Check if user is either the buyer or seller of this order
    if (!order.buyer.equals(req.user._id) && !order.seller.equals(req.user._id)) {
      return res.status(403).send({ message: 'You are not authorized to update this order' });
    }
    
    // Validate status update
    if (!['pending', 'completed', 'cancelled'].includes(req.body.status)) {
      return res.status(400).send({ message: 'Invalid status value' });
    }
    
    // Update status
    order.status = req.body.status;
    
    // Update meetup details if provided
    if (req.body.meetupLocation) {
      order.meetupLocation = req.body.meetupLocation;
    }
    
    if (req.body.meetupTime) {
      order.meetupTime = req.body.meetupTime;
    }
    
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

// Delete order (cancel) - Alternative to updating status
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }
    
    // Check if user is either the buyer or seller of this order
    if (!order.buyer.equals(req.user._id) && !order.seller.equals(req.user._id)) {
      return res.status(403).send({ message: 'You are not authorized to cancel this order' });
    }
    
    // Only allow cancellation if order is pending
    if (order.status !== 'pending') {
      return res.status(400).send({ message: 'Only pending orders can be cancelled' });
    }
    
    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();
    
    // Update product status back to available
    const product = await Product.findById(order.product);
    product.status = 'available';
    await product.save();
    
    res.send({ 
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).send({ message: 'Error cancelling order', error: error.message });
  }
});

module.exports = router;