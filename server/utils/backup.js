require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const CreditNote = require('../models/CreditNote');
const Settings = require('../models/Settings');
const Counter = require('../models/Counter');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');

async function runBackup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '-');

    const data = {
      customers: await Customer.find().lean(),
      products: await Product.find().lean(),
      invoices: await Invoice.find().lean(),
      quotations: await Quotation.find().lean(),
      creditNotes: await CreditNote.find().lean(),
      settings: await Settings.findOne().lean(),
      counters: await Counter.find().lean()
    };

    const backup = {
      exportDate: now.toISOString(),
      version: '1.0',
      counts: {
        customers: data.customers.length,
        products: data.products.length,
        invoices: data.invoices.length,
        quotations: data.quotations.length,
        creditNotes: data.creditNotes.length
      },
      data
    };

    const filename = `kukus_backup_${dateStr}_${timeStr}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    const fileSizeMB = (fs.statSync(filepath).size / (1024 * 1024)).toFixed(2);

    console.log('\n=== BACKUP COMPLETE ===');
    console.log(`File: ${filepath}`);
    console.log(`Size: ${fileSizeMB} MB`);
    console.log(`Customers: ${data.customers.length}`);
    console.log(`Products: ${data.products.length}`);
    console.log(`Invoices: ${data.invoices.length}`);
    console.log(`Quotations: ${data.quotations.length}`);
    console.log(`Credit Notes: ${data.creditNotes.length}`);
    console.log('========================\n');

    // Keep only last 30 backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('kukus_backup_') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length > 30) {
      const toDelete = files.slice(30);
      toDelete.forEach(f => {
        fs.unlinkSync(path.join(BACKUP_DIR, f));
        console.log(`Deleted old backup: ${f}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  }
}

runBackup();
