const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  oldQty: {
    type: Number,
    required: true
  },
  newQty: {
    type: Number,
    required: true
  },
  adjustedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true // e.g. damage, loss, recount, audit
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
