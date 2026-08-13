require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('./src/config/db');

const Customer = require('./src/models/customer');
const Vendor = require('./src/models/vendor');
const Product = require('./src/models/product');
const Order = require('./src/models/order');
const Branch = require('./src/models/branch');
const Bill = require('./src/models/bill');
const StockHistory = require('./src/models/stockHistory');

const seedData = async () => {
  try {
    await connectDb();
    console.log('[SEED] Connected to DB. Clearing some old data if needed (optional). We will just append.');

    // Seed Branches
    const branches = [];
    for (let i = 1; i <= 3; i++) {
      const b = await Branch.create({
        name: `Branch ${i} - ${['North', 'South', 'East'][i-1]} Zone`,
        address: `Location ${i}`,
        contact: `980000000${i}`
      });
      branches.push(b);
    }
    console.log(`[SEED] Created ${branches.length} branches.`);

    // Seed Vendors
    const vendors = [];
    const vendorNames = ['PharmaCorp', 'MediLife Supplies', 'HealthCare Distributors', 'Global Meds'];
    for (const vName of vendorNames) {
      const v = await Vendor.create({
        name: vName,
        contact: `contact@${vName.replace(/\s/g, '').toLowerCase()}.com`,
        address: 'Mumbai, MH',
        performanceScore: Math.floor(Math.random() * 20) + 80, // 80-100
        qualityRating: Math.floor(Math.random() * 2) + 4, // 4-5
        itemCategories: ['Medicines', 'Surgicals', 'Supplements']
      });
      vendors.push(v);
    }
    console.log(`[SEED] Created ${vendors.length} vendors.`);

    // Seed Products
    const products = [];
    const productNames = [
      'Paracetamol 500mg', 'Amoxicillin 250mg', 'Cetirizine 10mg', 'Vitamin C 1000mg', 
      'Ibuprofen 400mg', 'Omeprazole 20mg', 'Aspirin 75mg', 'Cough Syrup 100ml',
      'Bandages Pack', 'Surgical Masks (Box of 50)', 'Hand Sanitizer 500ml', 'Digital Thermometer'
    ];
    for (const pName of productNames) {
      const v = vendors[Math.floor(Math.random() * vendors.length)];
      const p = await Product.create({
        name: pName,
        description: `High quality ${pName}`,
        category: pName.includes('Mask') || pName.includes('Bandage') ? 'Surgicals' : 'Medicines',
        unit: pName.includes('Pack') ? 'pack' : (pName.includes('Box') ? 'box' : 'pcs'),
        price: Math.floor(Math.random() * 200) + 10,
        currentStock: Math.floor(Math.random() * 500) + 50,
        lowStockThreshold: 50,
        linkedVendor: v._id,
        hsnCode: `HSN${Math.floor(Math.random() * 1000) + 3000}`,
        branch: branches[0]._id // assign to branch 1 for simplicity
      });
      products.push(p);

      // Add stock history
      await StockHistory.create({
        product: p._id,
        type: 'in',
        quantity: p.currentStock,
        reason: 'adjustment',
        date: new Date()
      });
    }
    console.log(`[SEED] Created ${products.length} products.`);

    // Seed Customers
    const customers = [];
    const custNames = ['City Hospital', 'Green Cross Clinic', 'Dr. Sharma', 'Wellness Pharmacy', 'Apex Care Center', 'LifeLine Hospital'];
    for (const cName of custNames) {
      const c = await Customer.create({
        name: cName,
        mobile: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `contact@${cName.replace(/[\s\.]/g, '').toLowerCase()}.com`,
        address: 'Pune, MH',
        creditLimit: 50000,
        availableCredit: Math.floor(Math.random() * 20000) + 30000
      });
      customers.push(c);
    }
    console.log(`[SEED] Created ${customers.length} customers.`);

    // Seed Orders
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const items = [];
      let totalAmount = 0;
      
      const numItems = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < numItems; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 20) + 5;
        items.push({
          product: prod._id,
          quantity: qty,
          price: prod.price,
          vendor: prod.linkedVendor
        });
        totalAmount += qty * prod.price;
      }

      const statuses = ['Pending', 'Packed', 'Out for Delivery', 'Delivered'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const o = await Order.create({
        customer: customer._id,
        items,
        totalAmount,
        deliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (Math.random() * 5)), // Next 5 days
        status: status,
        paymentStatus: Math.random() > 0.5 ? 'Paid' : 'Pending',
        feedbackRating: status === 'Delivered' ? (Math.floor(Math.random() * 2) + 4) : undefined,
        feedbackComment: status === 'Delivered' ? 'Great service!' : undefined
      });
      orders.push(o);

      if (o.paymentStatus === 'Pending') {
        // Create a bill for it
        await Bill.create({
          orderId: o._id,
          customer: customer._id,
          subtotal: totalAmount,
          totalAmount: totalAmount,
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
          status: 'Unpaid'
        });
      } else {
        await Bill.create({
          orderId: o._id,
          customer: customer._id,
          subtotal: totalAmount,
          totalAmount: totalAmount,
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
          status: 'Paid'
        });
      }
    }
    console.log(`[SEED] Created ${orders.length} orders and bills.`);

    console.log('[SEED] Finished successfully!');
    process.exit(0);

  } catch (err) {
    console.error('[SEED] Error:', err);
    process.exit(1);
  }
};

seedData();
