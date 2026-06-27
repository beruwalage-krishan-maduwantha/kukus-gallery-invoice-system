const fs = require('fs');
const path = require('path');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const CreditNote = require('../models/CreditNote');
const Settings = require('../models/Settings');
const Counter = require('../models/Counter');
const Order = require('../models/Order');

exports.exportBackup = async (req, res) => {
  try {
    const customers = await Customer.find().lean();
    const products = await Product.find().lean();
    const invoices = await Invoice.find().lean();
    const quotations = await Quotation.find().lean();
    const creditNotes = await CreditNote.find().lean();
    const orders = await Order.find().lean();
    const settings = await Settings.findOne().lean();
    const counters = await Counter.find().lean();

    const now = new Date();
    const backup = {
      exportDate: now.toISOString(),
      version: '1.0',
      counts: {
        customers: customers.length,
        products: products.length,
        invoices: invoices.length,
        quotations: quotations.length,
        creditNotes: creditNotes.length,
        orders: orders.length
      },
      data: { customers, products, invoices, quotations, creditNotes, orders, settings, counters }
    };

    if (process.env.VERCEL !== '1') {
      try {
        const backupDir = path.join(__dirname, '..', '..', 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '-');
        const filename = `kukus_backup_${dateStr}_${timeStr}.json`;
        fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(backup, null, 2));
        console.log(`Backup saved: backups/${filename}`);
      } catch (err) {
        console.error('Local backup save failed:', err.message);
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=kukus_backup_${now.toISOString().slice(0, 10)}.json`);
    res.json(backup);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Backup failed' });
  }
};

exports.importBackup = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ message: 'No backup data provided' });

    const results = { customers: 0, products: 0, invoices: 0, quotations: 0, creditNotes: 0, orders: 0 };

    const restoreCollection = async (Model, docs, key) => {
      if (!docs?.length) return;
      for (const doc of docs) {
        const exists = await Model.findById(doc._id);
        if (!exists) {
          await Model.create({ ...doc, _id: doc._id });
          results[key]++;
        }
      }
    };

    await restoreCollection(Customer, data.customers, 'customers');
    await restoreCollection(Product, data.products, 'products');
    await restoreCollection(Invoice, data.invoices, 'invoices');
    await restoreCollection(Quotation, data.quotations, 'quotations');
    await restoreCollection(CreditNote, data.creditNotes, 'creditNotes');
    await restoreCollection(Order, data.orders, 'orders');

    if (data.counters?.length) {
      for (const doc of data.counters) {
        const exists = await Counter.findById(doc._id);
        if (!exists) await Counter.create({ ...doc, _id: doc._id });
      }
    }

    if (data.settings) {
      const existing = await Settings.findOne();
      if (!existing) await Settings.create(data.settings);
    }

    res.json({ message: 'Restore completed', results });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ message: 'Restore failed' });
  }
};

exports.getDbStats = async (req, res) => {
  try {
    const stats = {
      customers: await Customer.countDocuments(),
      products: await Product.countDocuments(),
      invoices: await Invoice.countDocuments(),
      quotations: await Quotation.countDocuments(),
      creditNotes: await CreditNote.countDocuments(),
      orders: await Order.countDocuments()
    };
    stats.totalDocuments = Object.values(stats).reduce((a, b) => a + b, 0);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stats' });
  }
};
