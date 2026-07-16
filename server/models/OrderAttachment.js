const mongoose = require('mongoose');

// Job sheet images (design / material) stored in MongoDB because the
// serverless filesystem is read-only. Separate collection keeps order list
// queries free of binary data.
const orderAttachmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  kind: { type: String, enum: ['design', 'material'], required: true },
  // A job sheet has multiple "design" blocks (one per design the client sent).
  // designIndex identifies the block; index identifies the image within that
  // block's design-image gallery (material only ever uses index 0).
  designIndex: { type: Number, default: 0 },
  index: { type: Number, default: 0 },
  filename: { type: String, required: true },
  mimeType: { type: String, default: 'image/jpeg' },
  size: { type: Number, default: 0 },
  data: { type: Buffer, required: true }
}, { timestamps: true });

orderAttachmentSchema.index({ order: 1, kind: 1, designIndex: 1, index: 1 }, { unique: true });

module.exports = mongoose.model('OrderAttachment', orderAttachmentSchema);
