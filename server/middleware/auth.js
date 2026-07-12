const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Sections staff users without an assigned job role may access (matches the
// behaviour before custom roles existed).
const LEGACY_STAFF_SECTIONS = ['quotations', 'invoices', 'orders', 'customers', 'expenses'];

const permissionsFor = async (user) => {
  if (user.role === 'admin') return ['*'];
  if (user.jobRole) {
    const Role = require('../models/Role');
    const role = await Role.findById(user.jobRole);
    if (role) return role.permissions || [];
  }
  return LEGACY_STAFF_SECTIONS;
};

// Allows the request when the user's role covers ANY of the given sections.
const requireSection = (...sections) => async (req, res, next) => {
  try {
    const perms = await permissionsFor(req.user);
    if (perms.includes('*') || sections.some(s => perms.includes(s))) return next();
    return res.status(403).json({ message: 'Your role does not have access to this section' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, adminOnly, requireSection, permissionsFor, LEGACY_STAFF_SECTIONS };
