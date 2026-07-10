const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: [
      // Kukus Gallery (garments)
      'Raw Materials', 'Fabric', 'Trims & Accessories', 'Printing', 'Embroidery',
      'Labour', 'Packaging', 'Maintenance',
      // Vertex Digital Solutions (agency)
      'Ad Spend (Meta/Google)', 'Software & Subscriptions', 'Hosting & Domains',
      'Freelancers', 'Content Production',
      // shared
      'Salaries', 'Rent', 'Utilities', 'Transport', 'Fuel', 'Equipment', 'Marketing', 'Office Supplies', 'Snacks', 'Other'
    ],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  description: { type: String },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque'], default: 'Cash' },
  chequeReleaseDate: { type: Date },
  reference: { type: String },
  attachment: {
    filename: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
