const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import all models
const User = require('../src/models/user');
const Customer = require('../src/models/customer');
const Vendor = require('../src/models/vendor');
const Product = require('../src/models/product');
const StockHistory = require('../src/models/stockHistory');
const Order = require('../src/models/order');
const Quotation = require('../src/models/quotation');
const Bill = require('../src/models/bill');
const Payment = require('../src/models/payment');
const Notification = require('../src/models/notification');
const Setting = require('../src/models/setting');
const Branch = require('../src/models/branch');
const Employee = require('../src/models/employee');
const PurchaseOrder = require('../src/models/purchaseOrder');
const StockAdjustment = require('../src/models/stockAdjustment');
const Expense = require('../src/models/expense');
const AuditLog = require('../src/models/auditLog');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sisdb';
    await mongoose.connect(uri);
    console.log('MongoDB connected for advanced seeding:', uri.split('@').pop());
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('Dropping database to clear stale indexes and collections...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped.');

    console.log('Seeding branches...');
    const b1 = new Branch({
      name: 'Pune Shivajinagar Branch (HQ)',
      address: 'Commercial Block 12, Shivajinagar, Pune',
      contact: '020-25674455'
    });
    await b1.save();

    const b2 = new Branch({
      name: 'Mumbai Andheri Extension',
      address: 'Metro Station Plaza, Andheri East, Mumbai',
      contact: '022-28203344'
    });
    await b2.save();

    console.log('Seeding company settings...');
    const setting = new Setting({
      companyName: 'Apex Medical & Retail Distributors',
      state: 'Maharashtra',
      logoUrl: '',
      address: 'Shop No 14, Commercial Plaza, Shivajinagar, Pune, Maharashtra - 411005',
      email: 'billing@apexmedical.com',
      contact: '9876543210',
      gstNumber: '27APEXM1234F1Z1',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountNo: '50100234567890',
        ifscCode: 'HDFC0000104',
        branch: 'Shivajinagar Branch'
      }
    });
    await setting.save();

    console.log('Seeding User login accounts...');
    // Admin login
    const adminUser = new User({
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      name: 'Aniket Kulkarni (Admin)',
      mobile: '9823456781',
      status: 'Active'
    });
    await adminUser.save();

    // Staff logins
    const staff1User = new User({
      email: 'staff@shop.com',
      password: 'staff123',
      role: 'staff',
      name: 'Ramesh Powar (Delivery Staff)',
      mobile: '9123456789',
      status: 'Active'
    });
    await staff1User.save();

    const staff2User = new User({
      email: 'staff2@shop.com',
      password: 'staff123',
      role: 'staff',
      name: 'Suresh More (Packer)',
      mobile: '9988776655',
      status: 'Active'
    });
    await staff2User.save();

    // Manager login
    const managerUser = new User({
      email: 'manager@shop.com',
      password: 'manager123',
      role: 'staff', // Logins mapped as admin/staff
      name: 'Pooja Deshpande (Manager)',
      mobile: '9860123456',
      status: 'Active'
    });
    await managerUser.save();

    console.log('Seeding Employee Profiles...');
    const empAdmin = new Employee({
      name: 'Aniket Kulkarni',
      mobile: '9823456781',
      role: 'Admin',
      user: adminUser._id,
      branch: b1._id,
      status: 'Active'
    });
    await empAdmin.save();

    const empStaff1 = new Employee({
      name: 'Ramesh Powar',
      mobile: '9123456789',
      role: 'Delivery Staff',
      user: staff1User._id,
      branch: b1._id,
      status: 'Active'
    });
    await empStaff1.save();

    const empStaff2 = new Employee({
      name: 'Suresh More',
      mobile: '9988776655',
      role: 'Packer',
      user: staff2User._id,
      branch: b1._id,
      status: 'Active'
    });
    await empStaff2.save();

    const empManager = new Employee({
      name: 'Pooja Deshpande',
      mobile: '9860123456',
      role: 'Manager',
      user: managerUser._id,
      branch: b2._id,
      status: 'Active'
    });
    await empManager.save();

    console.log('Seeding Supplier Vendors...');
    const supplier1 = new Vendor({
      name: 'Apex Pharma Distributors',
      contact: '020-25648899',
      address: 'GIDC Block B, Pimpri, Pune',
      itemCategories: ['Medicines', 'Vaccines'],
      gstNumber: '27APEXPH1234D1Z2'
    });
    await supplier1.save();

    const supplier2 = new Vendor({
      name: 'Hindustan Wellness Care',
      contact: '9888877777',
      address: 'Industrial Area Phase 2, Mumbai',
      itemCategories: ['Supplements', 'Hygiene'],
      gstNumber: '27HINDW9988C2Z4'
    });
    await supplier2.save();

    console.log('Seeding Products...');
    const p1 = new Product({
      name: 'Paracetamol 650mg Tablets',
      category: 'Medicines',
      unit: 'strips',
      price: 24.50,
      currentStock: 120,
      lowStockThreshold: 20,
      linkedVendor: supplier1._id,
      hsnCode: 'HSN3004',
      branch: b1._id
    });
    await p1.save();
    await StockHistory.create({ product: p1._id, quantity: 120, type: 'in', reason: 'purchase' });

    const p2 = new Product({
      name: 'Amoxicillin 500mg Capsules',
      category: 'Medicines',
      unit: 'strips',
      price: 98.00,
      currentStock: 8,
      lowStockThreshold: 15,
      linkedVendor: supplier1._id,
      hsnCode: 'HSN3004',
      branch: b1._id
    });
    await p2.save();
    await StockHistory.create({ product: p2._id, quantity: 8, type: 'in', reason: 'purchase' });

    const p3 = new Product({
      name: 'Vitamin C 500mg Chewable',
      category: 'Supplements',
      unit: 'bottles',
      price: 150.00,
      currentStock: 45,
      lowStockThreshold: 10,
      linkedVendor: supplier2._id,
      hsnCode: 'HSN2936',
      branch: b1._id
    });
    await p3.save();
    await StockHistory.create({ product: p3._id, quantity: 45, type: 'in', reason: 'purchase' });

    console.log('Seeding Customers...');
    const c1 = new Customer({
      name: 'Mahesh Patil Pharmacy',
      mobile: '9865321456',
      address: 'Shop No 2, Market Yard, Pune',
      gstNumber: '27MAHES1234A1ZA',
      notes: 'Requires delivery in morning slots only.',
      state: 'Maharashtra',
      branch: b1._id
    });
    await c1.save();

    const c2 = new Customer({
      name: 'Interstate Healthcare (Gujarat)',
      mobile: '9785461230',
      address: 'Commercial Hub Section 4, Vadodara, Gujarat',
      gstNumber: '24VADOD9988D2Z9',
      notes: 'Interstate delivery run.',
      state: 'Gujarat',
      branch: b1._id
    });
    await c2.save();

    console.log('Seeding Orders...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Order 1: Completed run
    const o1 = new Order({
      customer: c1._id,
      items: [
        { product: p1._id, quantity: 10, price: 24.50, vendor: supplier1._id }
      ],
      totalAmount: 245.00,
      deliveryDate: yesterday,
      status: 'Delivered',
      assignedStaff: staff1User._id,
      assignedTo: empStaff1._id,
      deliveredAt: yesterday,
      signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACNSURBVFhH7dExDcAgEERRtEEZ2sBOaCg0Gg/B1w58eXv18T73Wmvv2f+92nsc1qFvHfq2oW8b+rahbxv6tqFvG/q2oW8b+rahbxv6tqFvG/q2oW8b+rahbxv6tqFvG/q2oW8b+rahbxv6tqFvG/q2oW8b+rahbxv6tqFvG/q2oW8b+rahbxv69jnnA4B0U63Fj9pAAAAAAElFTkSuQmCC',
      branch: b1._id,
      statusHistory: [
        { status: 'Pending', timestamp: yesterday, updatedBy: adminUser._id },
        { status: 'Delivered', timestamp: yesterday, updatedBy: staff1User._id }
      ]
    });
    await o1.save();

    // Order 2: Scheduled tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const o2 = new Order({
      customer: c2._id,
      items: [
        { product: p3._id, quantity: 2, price: 150.00, vendor: supplier2._id }
      ],
      totalAmount: 300.00,
      deliveryDate: tomorrow,
      status: 'Assigned',
      assignedStaff: staff1User._id,
      assignedTo: empStaff1._id,
      branch: b1._id,
      statusHistory: [
        { status: 'Pending', timestamp: new Date(), updatedBy: adminUser._id },
        { status: 'Assigned', timestamp: new Date(), updatedBy: adminUser._id }
      ]
    });
    await o2.save();

    console.log('Seeding Invoices (Bills) & Payments...');
    // Intra-state Bill
    const b1Bill = new Bill({
      invoiceNumber: 'INV-2026-0001',
      order: o1._id,
      customer: c1._id,
      items: [
        { product: p1._id, quantity: 10, price: 24.50, cgst: 9, sgst: 9, igst: 0 }
      ],
      subtotal: 245.00,
      cgstTotal: 22.05,
      sgstTotal: 22.05,
      igstTotal: 0,
      totalAmount: 289.10,
      status: 'Paid',
      branch: b1._id,
      createdAt: yesterday
    });
    await b1Bill.save();

    const pay1 = new Payment({
      bill: b1Bill._id,
      order: o1._id,
      customer: c1._id,
      amountPaid: 289.10,
      paymentMode: 'UPI',
      referenceNumber: 'UPI9988776655',
      date: yesterday
    });
    await pay1.save();

    // Interstate Bill (Gujarat customer)
    const b2Bill = new Bill({
      invoiceNumber: 'INV-2026-0002',
      customer: c2._id,
      items: [
        { product: p3._id, quantity: 2, price: 150.00, cgst: 0, sgst: 0, igst: 18 }
      ],
      subtotal: 300.00,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 54.00,
      totalAmount: 354.00,
      status: 'Unpaid',
      branch: b1._id,
      createdAt: new Date()
    });
    await b2Bill.save();

    console.log('Seeding Expenses...');
    await new Expense({
      category: 'rent',
      amount: 15000,
      date: yesterday,
      notes: 'Monthly branch rent (Main HQ)',
      branch: b1._id
    }).save();

    await new Expense({
      category: 'fuel',
      amount: 1200,
      date: new Date(),
      notes: 'Weekly delivery runs fuel reimbursement',
      branch: b1._id
    }).save();

    console.log('Seeding Procurement Purchase Orders...');
    // Pending PO
    const po1 = new PurchaseOrder({
      supplier: supplier1._id,
      items: [
        { product: p2._id, quantity: 20, costPrice: 70.00 }
      ],
      totalCost: 1400.00,
      expectedDeliveryDate: tomorrow,
      status: 'Ordered',
      branch: b1._id
    });
    await po1.save();

    // Completed PO
    const po2 = new PurchaseOrder({
      supplier: supplier2._id,
      items: [
        { product: p3._id, quantity: 10, costPrice: 110.00 }
      ],
      totalCost: 1100.00,
      expectedDeliveryDate: yesterday,
      status: 'Received',
      branch: b1._id
    });
    await po2.save();

    console.log('Seeding Audit Logs...');
    await new AuditLog({
      user: adminUser._id,
      action: 'create',
      entity: 'Product',
      entityId: p1._id,
      diff: JSON.stringify({ name: p1.name, price: p1.price })
    }).save();

    await new AuditLog({
      user: adminUser._id,
      action: 'update',
      entity: 'Setting',
      entityId: adminUser._id,
      diff: 'Updated company bank coordinates'
    }).save();

    console.log('Seeding Notifications...');
    await Notification.create({
      title: 'Low Stock Alert',
      message: `Product "${p2.name}" has reached low stock: 8 left.`,
      type: 'low_stock',
      relatedId: p2._id
    });

    console.log('Advanced Database Seeding completed successfully! ✅');
    console.log('Demo Logins:');
    console.log('Admin Email: admin@school.com | Password: admin123');
    console.log('Staff Email: staff@shop.com | Password: staff123');
    console.log('Manager Email: manager@shop.com | Password: manager123');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

(async () => {
  await connectDB();
  await seedData();
  mongoose.connection.close();
})();
