const mongoose = require('mongoose');

// Job sheet images (design / material) stored in MongoDB because the
// serverless filesystem is read-only. Separate collection keeps order list
// queries free of binary data.
const orderAttachmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  kind: { type: String, enum: ['design', 'material'], required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, default: 'image/jpeg' },
  size: { type: Number, default: 0 },
  data: { type: Buffer, required: true }
}, { timestamps: true });

orderAttachmentSchema.index({ order: 1, kind: 1 }, { unique: true });

module.exports = mongoose.model('OrderAttachment', orderAttachmentSchema);
