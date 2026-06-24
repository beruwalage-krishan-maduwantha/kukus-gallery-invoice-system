const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    enum: ['Design Wear', 'Corporate Clothing'],
    required: true
  },
  defaultPrice: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'piece', enum: ['piece', 'meter', 'yard', 'set', 'hour', 'lot'] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
