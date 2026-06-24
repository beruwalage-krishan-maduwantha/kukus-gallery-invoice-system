const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true },
  notes: { type: String },
  status: { type: String, enum: ['Active', 'Used', 'Expired'], default: 'Active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

creditNoteSchema.index({ customer: 1 });
creditNoteSchema.index({ status: 1 });

module.exports = mongoose.model('CreditNote', creditNoteSchema);
