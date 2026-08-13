const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');

let qrCodeDataURL = null;
let isReady = false;
const isEnabled = process.env.WHATSAPP_ENABLED === 'true';
let client = null;

const getStatus = () => ({
    enabled: isEnabled,
    isReady,
    qrCodeDataURL
});

const logout = async () => {
    if (!client) return false;
    try {
        await client.logout();
        isReady = false;
        qrCodeDataURL = null;
        return true;
    } catch (err) {
        console.error('[WhatsApp Local] Logout error:', err);
        return false;
    }
};

const sendMessage = async (mobile, text) => {
    if (!client || !isReady) {
        throw new Error('Local WhatsApp client is not connected.');
    }
    const formattedNumber = `${String(mobile).replace(/\D/g, '')}@c.us`;
    await client.sendMessage(formattedNumber, text);
};

// Initialize the client
if (isEnabled) {
client = new Client({
    authStrategy: new LocalAuth({
        dataPath: process.env.WHATSAPP_SESSION_PATH || path.join(process.cwd(), '.wwebjs_auth')
    }),
    puppeteer: {
        executablePath: process.env.CHROME_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: [
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu'
        ]
    }
});

client.on('qr', async (qr) => {
    try {
        console.log('[WhatsApp Local] New QR Code generated. Awaiting scan...');
        qrCodeDataURL = await qrcode.toDataURL(qr);
        isReady = false;
    } catch (err) {
        console.error('[WhatsApp Local] Failed to generate QR data url', err);
    }
});

client.on('ready', () => {
    console.log('[WhatsApp Local] Client is ready and authenticated!');
    qrCodeDataURL = null; // Clear QR code as it's no longer needed
    isReady = true;
});

client.on('authenticated', () => {
    console.log('[WhatsApp Local] Authentication successful.');
});

client.on('auth_failure', (msg) => {
    console.error('[WhatsApp Local] Authentication failure:', msg);
    qrCodeDataURL = null;
    isReady = false;
});

client.on('disconnected', (reason) => {
    console.log('[WhatsApp Local] Client was disconnected:', reason);
    qrCodeDataURL = null;
    isReady = false;
});

// Start client asynchronously
client.initialize().catch(err => {
    console.error('[WhatsApp Local] Failed to initialize client:', err);
});
}

module.exports = {
    client,
    getStatus,
    logout,
    sendMessage
};
