const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: false,   // Optional — manual ledger payments may not have a linked bill
    default: null
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0.01
  },
  paymentMode: {
    type: String,
    enum: [
      'cash', 'Cash',
      'UPI', 'UPI / QR',
      'bank transfer', 'Bank Transfer', 'Bank Transfer / NEFT',
      'cheque', 'Cheque',
      'Credit Card', 'Credit / Debit Card',
      'Other'
    ],
    required: true
  },
  category: {
    type: String,
    default: 'Ledger Settlement'
  },
  date: {
    type: Date,
    default: Date.now
  },
  referenceNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
