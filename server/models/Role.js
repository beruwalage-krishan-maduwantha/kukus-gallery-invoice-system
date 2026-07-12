const mongoose = require('mongoose');

// Custom job roles (e.g. Production Manager, Accountant, Tailor) with a list
// of system sections the role may access. The built-in 'admin' user role
// always has full access and is not stored here.
const SECTIONS = [
  'dashboard', 'quotations', 'invoices', 'orders', 'expenses',
  'creditNotes', 'reports', 'customers', 'products'
];

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  permissions: [{ type: String, enum: SECTIONS }]
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
module.exports.SECTIONS = SECTIONS;
