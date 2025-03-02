const mongoose = require('mongoose');

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

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;