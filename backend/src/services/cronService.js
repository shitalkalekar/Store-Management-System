const cron = require('node-cron');
const Order = require('../models/order');
const Notification = require('../models/notification');

// Scans for deliveries scheduled for tomorrow and generates in-app notifications
const runReminderJob = async () => {
  console.log('[cron-service] Running daily upcoming delivery reminders scan...');
  try {
    const today = new Date();
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(today);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const upcomingOrders = await Order.find({
      deliveryDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $in: ['Pending', 'Assigned', 'Packed'] }
    }).populate('customer').populate('assignedStaff');

    console.log(`[cron-service] Found ${upcomingOrders.length} orders scheduled for tomorrow.`);

    let notificationsCreated = 0;
    for (const order of upcomingOrders) {
      // Check if a reminder notification already exists for this order
      const existing = await Notification.findOne({
        type: 'delivery_reminder',
        relatedId: order._id
      });

      if (!existing) {
        const staffName = order.assignedStaff ? order.assignedStaff.name : 'Unassigned';
        const msg = `Order for customer "${order.customer.name}" is scheduled for delivery tomorrow. Assigned Delivery Executive: ${staffName}.`;
        
        await Notification.create({
          title: 'Upcoming Delivery Reminder',
          message: msg,
          type: 'delivery_reminder',
          relatedId: order._id
        });
        notificationsCreated++;
      }
    }

    console.log(`[cron-service] Created ${notificationsCreated} upcoming delivery notification reminders.`);
  } catch (err) {
    console.error('[cron-service] Error running reminder job:', err.message);
  }
};

const runRecurringOrdersJob = async () => {
  console.log('[cron-service] Scanning for recurring orders to auto-create...');
  try {
    const today = new Date();

    const activeRecurringOrders = await Order.find({
      isRecurring: true,
      status: 'Delivered',
      recurringProcessed: false
    }).populate('customer');

    const expiredRecurringOrders = [];
    for (const ord of activeRecurringOrders) {
      const baseDate = ord.deliveredAt || ord.deliveryDate || ord.createdAt || new Date();
      const intervalDays = ord.recurringIntervalDays || 30;
      const triggerDate = new Date(new Date(baseDate).getTime() + intervalDays * 24 * 60 * 60 * 1000);
      
      if (today >= triggerDate) {
        expiredRecurringOrders.push(ord);
      }
    }

    console.log(`[cron-service] Found ${expiredRecurringOrders.length} recurring orders ready for regeneration.`);

    let count = 0;
    for (const oldOrder of expiredRecurringOrders) {
      const newOrderDate = new Date();
      
      const newOrder = new Order({
        customer: oldOrder.customer._id,
        items: oldOrder.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          vendor: item.vendor
        })),
        totalAmount: oldOrder.totalAmount,
        deliveryDate: newOrderDate,
        status: 'Pending',
        branch: oldOrder.branch,
        isRecurring: true,
        recurringIntervalDays: oldOrder.recurringIntervalDays || 30,
        recurringSourceOrder: oldOrder._id,
        recurringProcessed: false
      });

      await newOrder.save();

      oldOrder.recurringProcessed = true;
      await oldOrder.save();

      await Notification.create({
        title: 'Recurring Order Auto-Created',
        message: `A new recurring order was auto-created for customer "${oldOrder.customer.name}" based on delivered Order ORD-${oldOrder._id.toString().substring(18).toUpperCase()}.`,
        type: 'recurring_order',
        relatedId: newOrder._id
      });

      count++;
    }

    if (count > 0) {
      console.log(`[cron-service] Successfully auto-created ${count} recurring orders.`);
    }
  } catch (err) {
    console.error('[cron-service] Error running recurring orders job:', err.message);
  }
};

const runWeeklySqliteBackupJob = async () => {
  console.log('[cron-service] Running weekly MongoDB to SQLite backup job...');
  try {
    const { runBackupToSqlite } = require('../../scripts/backupToSqlite');
    await runBackupToSqlite();
    console.log('[cron-service] Weekly SQLite backup job completed successfully.');
  } catch (err) {
    console.error('[cron-service] Error running weekly SQLite backup job:', err.message);
  }
};

const initCron = () => {
  // Run daily jobs every day at midnight (00:00)
  cron.schedule('0 0 * * *', () => {
    runReminderJob();
    runRecurringOrdersJob();
  });

  // Run SQLite backup job once every week (Every Sunday at 00:00)
  cron.schedule('0 0 * * 0', () => {
    runWeeklySqliteBackupJob();
  });
  
  console.log('[cron-service] node-cron schedulers (daily reminders/recurring & weekly SQLite backup) initialized successfully.');
  
  // Proactively run daily jobs once on startup
  setTimeout(() => {
    runReminderJob();
    runRecurringOrdersJob();
  }, 5000);
};

module.exports = { initCron, runReminderJob, runRecurringOrdersJob, runWeeklySqliteBackupJob };

