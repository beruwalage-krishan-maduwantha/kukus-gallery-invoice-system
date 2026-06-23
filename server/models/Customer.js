const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  company: { type: String, trim: true },
  notes: { type: String },
  totalInvoices: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

customerSchema.index({ name: 'text', email: 'text', phone: 'text', company: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
