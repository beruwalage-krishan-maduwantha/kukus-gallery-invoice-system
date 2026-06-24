const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  orderType: { type: String, enum: ['Sample', 'Bulk'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  lineTotal: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerSnapshot: {
    name: String,
    email: String,
    phone: String,
    address: String,
    company: String
  },
  items: [lineItemSchema],
  subtotal: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  invoiceDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  paidDate: { type: Date },
  paymentType: { type: String, enum: ['Bank Transfer', 'Cash', 'Credits'], default: 'Cash' },
  notes: { type: String },
  terms: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pdfFilename: { type: String }
}, { timestamps: true });

invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ 'customerSnapshot.name': 'text', invoiceNumber: 'text' });

module.exports = mongoose.model('Invoice', invoiceSchema);
