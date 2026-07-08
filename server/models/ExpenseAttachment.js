const mongoose = require('mongoose');

// Receipt/document files attached to expenses. Stored in MongoDB because the
// serverless filesystem is read-only. Kept in a separate collection so list
// queries never load file data.
const expenseAttachmentSchema = new mongoose.Schema({
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true, index: true },
  filename: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  size: { type: Number, default: 0 },
  data: { type: Buffer, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ExpenseAttachment', expenseAttachmentSchema);
