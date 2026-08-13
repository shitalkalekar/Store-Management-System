require('dotenv').config();
const app = require('./src/app');
const { connectDb } = require('./src/config/db');
const env = require('./src/config/env');
const { initCron } = require('./src/services/cronService');

const autoSeed = async () => {
  try {
    const User = require('./src/models/user');
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[seed] Database is empty. Auto-seeding initial shop admin and staff users...');
      
      // Initial administrator credentials must come from the environment.
      const admin = new User({
        email: env.INITIAL_ADMIN_EMAIL,
        password: env.INITIAL_ADMIN_PASSWORD,
        role: 'admin',
        name: env.INITIAL_ADMIN_NAME,
        mobile: env.INITIAL_ADMIN_MOBILE,
        status: 'Active'
      });
      await admin.save();
      console.log('[seed] Initial administrator created from environment configuration');

      // Default Setting
      const Setting = require('./src/models/setting');
      const setting = new Setting({
        companyName: 'Apex Medical Shop',
        address: 'Pune, Maharashtra',
        email: env.INITIAL_ADMIN_EMAIL,
        contact: env.INITIAL_ADMIN_MOBILE
      });
      await setting.save();
      console.log('[seed] Default settings created.');
      console.log('[seed] Auto-seeding complete! ✅');
    }
  } catch (err) {
    console.error('[seed] Auto-seed failed (will skip):', err.message);
  }
};

(async () => {
  try {
    env.assertSafeConfiguration();
    await connectDb();
    if (env.AUTO_SEED) await autoSeed();
    if (env.WHATSAPP_ENABLED) require('./src/services/whatsappClient');
    initCron();
    
    app.listen(env.PORT, env.HOST, () => {
      console.log('[shop-management] backend listening on http://' + env.HOST + ':' + env.PORT);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
})();
