const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  mfgDate: {
    type: Date,
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  purchasePrice: {
    type: Number,
    default: 0,
    min: 0
  },
  retailPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for batch lookup and expiry range queries
batchSchema.index({ product: 1, batchNumber: 1 });
batchSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Batch', batchSchema);
