const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const CreditNote = require('../models/CreditNote');
const Settings = require('../models/Settings');

exports.exportBackup = async (req, res) => {
  try {
    const customers = await Customer.find();
    const products = await Product.find();
    const invoices = await Invoice.find();
    const quotations = await Quotation.find();
    const creditNotes = await CreditNote.find();
    const settings = await Settings.findOne();

    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: { customers, products, invoices, quotations, creditNotes, settings }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=kukus_backup_${new Date().toISOString().slice(0, 10)}.json`);
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

    const results = { customers: 0, products: 0, invoices: 0, quotations: 0, creditNotes: 0 };

    if (data.customers?.length) {
      for (const doc of data.customers) {
        const exists = await Customer.findById(doc._id);
        if (!exists) {
          await Customer.create({ ...doc, _id: doc._id });
          results.customers++;
        }
      }
    }

    if (data.products?.length) {
      for (const doc of data.products) {
        const exists = await Product.findById(doc._id);
        if (!exists) {
          await Product.create({ ...doc, _id: doc._id });
          results.products++;
        }
      }
    }

    if (data.invoices?.length) {
      for (const doc of data.invoices) {
        const exists = await Invoice.findById(doc._id);
        if (!exists) {
          await Invoice.create({ ...doc, _id: doc._id });
          results.invoices++;
        }
      }
    }

    if (data.quotations?.length) {
      for (const doc of data.quotations) {
        const exists = await Quotation.findById(doc._id);
        if (!exists) {
          await Quotation.create({ ...doc, _id: doc._id });
          results.quotations++;
        }
      }
    }

    if (data.creditNotes?.length) {
      for (const doc of data.creditNotes) {
        const exists = await CreditNote.findById(doc._id);
        if (!exists) {
          await CreditNote.create({ ...doc, _id: doc._id });
          results.creditNotes++;
        }
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
      creditNotes: await CreditNote.countDocuments()
    };
    stats.totalDocuments = Object.values(stats).reduce((a, b) => a + b, 0);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stats' });
  }
};
