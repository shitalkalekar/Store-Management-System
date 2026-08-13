const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor', // Reuses Vendor model
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Ordered', 'Partially Received', 'Fully Received', 'Received', 'Locked', 'Cancelled'],
    default: 'Pending'
  },
  receivingHistory: [{
    receivedBy: { type: String, default: 'Admin' },
    date: { type: Date, default: Date.now },
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 0 },
      location: { type: String, default: '' },
      remarks: { type: String, default: '' }
    }]
  }],
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
