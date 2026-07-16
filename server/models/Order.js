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
    // A client can send multiple designs in one order - each is its own
    // block with its own reference images, material, and size quantities.
    designs: [{
      designIndex: { type: Number, default: 0 },
      designImages: [{
        filename: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        index: { type: Number, default: 0 }
      }],
      // 'women' uses the standard XS-4XL sizes; 'kids' uses age-range sizes.
      // Size keys vary by type (see SIZE_CHARTS in the client), so sizes are
      // stored as flexible objects rather than a fixed shape.
      sizeType: { type: String, enum: ['women', 'kids'], default: 'women' },
      // One row per colour/material: its swatch image + size quantities
      materials: [{
        index: { type: Number, default: 0 },
        image: { filename: { type: String, default: '' }, mimeType: { type: String, default: '' } },
        sizes: { type: mongoose.Schema.Types.Mixed, default: {} }
      }],
      notes: { type: String, default: '' },
      // Legacy single-material fields, read-only for old records
      materialImage: { filename: { type: String, default: '' }, mimeType: { type: String, default: '' } },
      sizeBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} }
    }],
    trims: [{
      item: { type: String, default: '' },
      quantity: { type: String, default: '' }
    }],
    notes: { type: String, default: '' },
    // Legacy fields, kept for old records only - no longer written
    sizeOption: { type: String, enum: ['', 'Standard Size', 'Client Size'], default: '' },
    sizeBreakdown: [{
      color: { type: String, default: '' },
      xs: { type: Number, default: 0 }, s: { type: Number, default: 0 }, m: { type: Number, default: 0 },
      l: { type: Number, default: 0 }, xl: { type: Number, default: 0 }, xxl: { type: Number, default: 0 },
      xxxl: { type: Number, default: 0 }, xxxxl: { type: Number, default: 0 }
    }],
    designImage: { filename: { type: String, default: '' }, mimeType: { type: String, default: '' } },
    designImages: [{
      filename: { type: String, default: '' }, mimeType: { type: String, default: '' }, index: { type: Number, default: 0 }
    }],
    materialImage: { filename: { type: String, default: '' }, mimeType: { type: String, default: '' } }
  }
}, { timestamps: true });

orderSchema.index({ invoice: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
