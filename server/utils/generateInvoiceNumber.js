const Counter = require('../models/Counter');

async function generateInvoiceNumber(prefix = 'KG') {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `invoice_${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${year}-${String(counter.seq).padStart(4, '0')}`;
}

module.exports = generateInvoiceNumber;
