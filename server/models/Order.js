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
    enum: ['Pending', 'Processing', 'Alternative', 'Delivered', 'Done'],
    default: 'Pending'
  },
  approved: { type: Boolean, default: false },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobSheet: {
    filled: { type: Boolean, default: false },
    // Sample job sheets
    sizeOption: { type: String, enum: ['', 'Standard Size', 'Client Size'], default: '' },
    // Bulk job sheets
    sizeBreakdown: [{
      color: { type: String, default: '' },
      s: { type: Number, default: 0 },
      m: { type: Number, default: 0 },
      l: { type: Number, default: 0 },
      xl: { type: Number, default: 0 },
      xxl: { type: Number, default: 0 }
    }],
    trims: [{
      item: { type: String, default: '' },
      quantity: { type: String, default: '' }
    }],
    // shared
    notes: { type: String, default: '' },
    designImage: { filename: { type: String, default: '' }, mimeType: { type: String, default: '' } },
    materialImage: { filename: { type: String, default: '' }, mimeType: { type: String, default: '' } }
  }
}, { timestamps: true });

orderSchema.index({ invoice: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
