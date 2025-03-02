const mongoose = require('mongoose');

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

const Product = mongoose.model('Product', productSchema);

module.exports = Product;