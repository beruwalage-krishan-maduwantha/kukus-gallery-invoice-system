const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['Raw Materials', 'Fabric', 'Trims & Accessories', 'Printing', 'Embroidery', 'Labour', 'Salaries', 'Rent', 'Utilities', 'Transport', 'Packaging', 'Equipment', 'Maintenance', 'Marketing', 'Office Supplies', 'Other'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  description: { type: String },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque'], default: 'Cash' },
  chequeReleaseDate: { type: Date },
  reference: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
