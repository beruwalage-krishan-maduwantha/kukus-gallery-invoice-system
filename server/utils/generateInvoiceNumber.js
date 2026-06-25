const Counter = require('../models/Counter');

async function generateInvoiceNumber(prefix = 'KG') {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'invoice_global' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}${String(counter.seq).padStart(3, '0')}`;
}

module.exports = generateInvoiceNumber;
