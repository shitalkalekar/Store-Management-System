const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['rent', 'salary', 'fuel', 'misc'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    max: 1000000000
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },
  receiptImage: {
    type: String, // Base64 DataURI
    default: '',
    maxlength: 750000
  },
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

module.exports = mongoose.model('Expense', expenseSchema);
