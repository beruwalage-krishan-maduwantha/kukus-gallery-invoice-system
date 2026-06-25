const { validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const CreditNote = require('../models/CreditNote');
const Settings = require('../models/Settings');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');

exports.getInvoices = async (req, res) => {
  try {
    const { search, status, customer, dateFrom, dateTo, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (dateFrom || dateTo) {
      query.invoiceDate = {};
      if (dateFrom) query.invoiceDate.$gte = new Date(dateFrom);
      if (dateTo) query.invoiceDate.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone email company title')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { customer: customerId, items, discountType, discountValue, paymentType, notes, terms, invoiceDate, deliveryDate, advancePayment } = req.body;

    const customerDoc = await Customer.findById(customerId);
    if (!customerDoc) return res.status(404).json({ message: 'Customer not found' });

    const settings = await Settings.findOne();
    const invoiceNumber = await generateInvoiceNumber(settings?.invoicePrefix || 'KG');

    const processedItems = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      return { ...item, lineTotal: Math.round(lineTotal * 100) / 100 };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = subtotal * ((discountValue || 0) / 100);
    } else {
      discountAmount = discountValue || 0;
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
    const grandTotal = Math.round((subtotal - discountAmount) * 100) / 100;

    const advance = Number(advancePayment) || 0;
    const balance = Math.round((grandTotal - advance) * 100) / 100;

    let status = 'Draft';
    if (paymentType === 'Credits') {
      status = 'Overdue';
    } else if (paymentType === 'Bank Transfer' || paymentType === 'Cash') {
      status = balance <= 0 ? 'Paid' : 'Sent';
    }

    const sanitizedName = customerDoc.name.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedPhone = customerDoc.phone.replace(/[^0-9]/g, '');

    const invoice = await Invoice.create({
      invoiceNumber,
      customer: customerId,
      customerSnapshot: {
        title: customerDoc.title || '',
        name: customerDoc.name,
        email: customerDoc.email,
        phone: customerDoc.phone,
        address: customerDoc.address,
        company: customerDoc.company
      },
      items: processedItems,
      subtotal, discountType: discountType || 'percentage',
      discountValue: discountValue || 0, discountAmount, grandTotal,
      advancePayment: advance,
      balance: balance,
      status,
      invoiceDate: invoiceDate || new Date(),
      deliveryDate: deliveryDate || undefined,
      paidDate: status === 'Paid' ? new Date() : undefined,
      paymentType: paymentType || 'Cash',
      notes: notes || settings?.defaultNotes || '',
      terms: terms || settings?.defaultTerms || '',
      createdBy: req.user._id,
      pdfFilename: `${sanitizedName}_${sanitizedPhone}.pdf`
    });

    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalInvoices: 1, totalSpent: grandTotal }
    });

    if (paymentType === 'Credits') {
      await CreditNote.create({
        customer: customerId,
        invoice: invoice._id,
        amount: grandTotal,
        reason: `Invoice ${invoiceNumber} - Credits payment`,
        status: 'Active',
        createdBy: req.user._id
      });
    }

    const populated = await Invoice.findById(invoice._id)
      .populate('customer').populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const { items, discountType, discountValue, paymentType, notes, terms, deliveryDate, advancePayment } = req.body;

    if (items) {
      const processedItems = items.map(item => {
        const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        return { ...item, lineTotal: Math.round(lineTotal * 100) / 100 };
      });
      const subtotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const dtype = discountType || invoice.discountType;
      const dval = discountValue !== undefined ? discountValue : invoice.discountValue;
      let discountAmount = dtype === 'percentage' ? subtotal * (dval / 100) : dval;
      discountAmount = Math.round(discountAmount * 100) / 100;
      const grandTotal = Math.round((subtotal - discountAmount) * 100) / 100;

      const oldTotal = invoice.grandTotal;
      await Customer.findByIdAndUpdate(invoice.customer, {
        $inc: { totalSpent: grandTotal - oldTotal }
      });

      invoice.items = processedItems;
      invoice.subtotal = subtotal;
      invoice.discountType = dtype;
      invoice.discountValue = dval;
      invoice.discountAmount = discountAmount;
      invoice.grandTotal = grandTotal;
    }

    if (paymentType) invoice.paymentType = paymentType;

    if (advancePayment !== undefined) {
      invoice.advancePayment = Number(advancePayment) || 0;
    }
    invoice.balance = Math.round((invoice.grandTotal - (invoice.advancePayment || 0)) * 100) / 100;

    if (invoice.paymentType === 'Credits') {
      invoice.status = 'Overdue';
    } else if (invoice.balance <= 0) {
      invoice.status = 'Paid';
      invoice.paidDate = new Date();
    } else if (invoice.advancePayment > 0) {
      invoice.status = 'Sent';
    }
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;
    if (deliveryDate) invoice.deliveryDate = deliveryDate;

    await invoice.save();
    const populated = await Invoice.findById(invoice._id)
      .populate('customer').populate('createdBy', 'name');
    res.json(populated);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const validTransitions = {
      'Draft': ['Sent', 'Paid', 'Cancelled'],
      'Sent': ['Paid', 'Overdue', 'Cancelled'],
      'Overdue': ['Paid', 'Cancelled'],
      'Paid': [],
      'Cancelled': []
    };

    if (!validTransitions[invoice.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot change from ${invoice.status} to ${status}` });
    }

    invoice.status = status;
    if (status === 'Paid') invoice.paidDate = new Date();
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addAdvancePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const advance = (invoice.advancePayment || 0) + Number(amount);
    invoice.advancePayment = Math.round(advance * 100) / 100;
    invoice.balance = Math.round((invoice.grandTotal - invoice.advancePayment) * 100) / 100;

    if (invoice.paymentType === 'Credits') {
      invoice.status = 'Overdue';
    } else if (invoice.balance <= 0) {
      invoice.status = 'Paid';
      invoice.paidDate = new Date();
    } else {
      invoice.status = 'Sent';
    }

    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status !== 'Draft') return res.status(400).json({ message: 'Only draft invoices can be deleted' });

    await Customer.findByIdAndUpdate(invoice.customer, {
      $inc: { totalInvoices: -1, totalSpent: -invoice.grandTotal }
    });
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
