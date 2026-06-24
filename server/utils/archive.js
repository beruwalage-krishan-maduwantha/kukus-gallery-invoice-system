require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups', 'archives');

async function archiveOldInvoices() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const oldPaidInvoices = await Invoice.find({
      status: 'Paid',
      paidDate: { $lt: oneYearAgo }
    }).lean();

    if (oldPaidInvoices.length === 0) {
      console.log('No paid invoices older than 1 year to archive.');
      process.exit(0);
    }

    console.log(`Found ${oldPaidInvoices.length} paid invoices older than 1 year`);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `archive_paid_invoices_${dateStr}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify({
      archiveDate: new Date().toISOString(),
      cutoffDate: oneYearAgo.toISOString(),
      count: oldPaidInvoices.length,
      invoices: oldPaidInvoices
    }, null, 2));

    console.log(`Archived to: ${filepath}`);

    for (const inv of oldPaidInvoices) {
      await Customer.findByIdAndUpdate(inv.customer, {
        $inc: { totalInvoices: -1, totalSpent: -inv.grandTotal }
      });
      await Invoice.findByIdAndDelete(inv._id);
    }

    console.log(`\n=== ARCHIVE COMPLETE ===`);
    console.log(`Archived & removed: ${oldPaidInvoices.length} invoices`);
    console.log(`File: ${filepath}`);
    console.log(`========================\n`);

    process.exit(0);
  } catch (error) {
    console.error('Archive failed:', error.message);
    process.exit(1);
  }
}

archiveOldInvoices();
