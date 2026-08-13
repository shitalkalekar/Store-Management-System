const User = require('../models/user');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const isStrongPassword = (password) => typeof password === 'string' &&
  password.length >= 12 && password.length <= 128 &&
  /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);

const signToken = (subject, authType, claims, expiresIn) => jwt.sign(
  { ...claims, authType },
  env.JWT_SECRET,
  {
    algorithm: 'HS256',
    subject: subject.toString(),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn,
  }
);

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if status is Active
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    // Sign JWT
    const token = signToken(user._id, 'owner', { role: user.role }, env.JWT_EXPIRES_IN);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        mobile: user.mobile
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        mobile: user.mobile
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !isStrongPassword(newPassword)) {
      return res.status(400).json({ error: 'A valid current password and a strong new password are required' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'The new password must be different' });
    }

    if (req.user.authType !== 'owner' || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Password changes require the owner account' });
    }

    const account = await User.findById(req.user.id).select('+password');
    if (!account || !(await account.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    account.password = newPassword;
    await account.save();
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
