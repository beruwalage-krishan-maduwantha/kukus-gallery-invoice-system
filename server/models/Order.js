const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  invoiceNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerSnapshot: {
    title: { type: String, default: '' },
    name: String,
    phone: String
  },
  productName: { type: String, required: true },
  category: { type: String },
  orderType: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  invoiceDate: { type: Date },
  deliveryDate: { type: Date },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Alternative', 'Delivery'],
    default: 'Pending'
  },
  approved: { type: Boolean, default: false },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

orderSchema.index({ invoice: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
