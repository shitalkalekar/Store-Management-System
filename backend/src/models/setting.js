const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'NARESH ENTERPRISES'
  },
  state: {
    type: String,
    default: 'Maharashtra'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: 'Office H. No.34/B, No.31L.H. Colony, Beside Govt. ITI, NANDED'
  },
  email: {
    type: String,
    default: 'contact@nareshenterprises.com'
  },
  contact: {
    type: String,
    default: '9822311640, 7020317605'
  },
  gstNumber: {
    type: String,
    default: '27AAAAA0000A1Z5'
  },
  bankDetails: {
    bankName: { type: String, default: 'State Bank of India' },
    accountNo: { type: String, default: '12345678901' },
    ifscCode: { type: String, default: 'SBIN0001234' },
    branch: { type: String, default: 'Shivajinagar Branch' }
  },
  smsTemplates: {
    marathi: {
      type: String,
      default: 'प्रिय {customer_name}, तुमचे थकीत बिल {amount} रुपये प्रलंबित आहे. कृपया लवकरात लवकर भरणा करावा. धन्यवाद, {company_name}.'
    },
    english: {
      type: String,
      default: 'Dear {customer_name}, your outstanding payment of Rs. {amount} is pending. Please pay at the earliest. Thank you, {company_name}.'
    }
  },
  pdfSettings: {
    billPageSize: {
      type: String,
      enum: ['A4', 'A5', 'LETTER', 'THERMAL_80MM'],
      default: 'A4'
    },
    quotationPageSize: {
      type: String,
      enum: ['A4', 'A5', 'LETTER'],
      default: 'A4'
    },
    billTemplate: {
      type: String,
      enum: ['CLASSIC_MEMO_BOOK', 'MODERN_TAX_INVOICE', 'ELEGANT_MINIMAL', 'THERMAL_POS'],
      default: 'CLASSIC_MEMO_BOOK'
    }
  },
  whatsappProvider: {
    type: String,
    default: 'meta'
  },
  whatsappPhoneId: {
    type: String,
    default: ''
  },
  whatsappToken: {
    type: String,
    default: '',
    select: false
  }
});

module.exports = mongoose.model('Setting', settingSchema);
