const { validationResult } = require('express-validator');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const Counter = require('../models/Counter');
const Order = require('../models/Order');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');

async function generateQuotationNumber(prefix = 'QT') {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'quotation_global' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}${String(counter.seq).padStart(3, '0')}`;
}

exports.getQuotations = async (req, res) => {
  try {
    const { search, status, customer, dateFrom, dateTo, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (dateFrom || dateTo) {
      query.quotationDate = {};
      if (dateFrom) query.quotationDate.$gte = new Date(dateFrom);
      if (dateTo) query.quotationDate.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .populate('customer', 'name phone email company')
      .populate('createdBy', 'name')
      .populate('convertedInvoice', 'invoiceNumber')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ quotations, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name')
      .populate('convertedInvoice', 'invoiceNumber _id');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createQuotation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { customer: customerId, items, discountType, discountValue, notes, terms, quotationDate, validUntil, deliveryDate } = req.body;

    const customerDoc = await Customer.findById(customerId);
    if (!customerDoc) return res.status(404).json({ message: 'Customer not found' });

    const quotationNumber = await generateQuotationNumber();

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

    const sanitizedName = customerDoc.name.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedPhone = customerDoc.phone.replace(/[^0-9]/g, '');

    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 7);

    const quotation = await Quotation.create({
      quotationNumber,
      customer: customerId,
      customerSnapshot: {
        name: customerDoc.name, email: customerDoc.email,
        phone: customerDoc.phone, address: customerDoc.address, company: customerDoc.company
      },
      items: processedItems,
      subtotal, discountType: discountType || 'percentage',
      discountValue: discountValue || 0, discountAmount, grandTotal,
      status: req.body.status || 'Draft',
      quotationDate: quotationDate || new Date(),
      validUntil: validUntil || defaultValidUntil,
      deliveryDate: deliveryDate || undefined,
      notes: notes || '', terms: terms || '',
      createdBy: req.user._id,
      pdfFilename: `${sanitizedName}_${quotationNumber}.pdf`
    });

    const populated = await Quotation.findById(quotation._id)
      .populate('customer').populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (quotation.status !== 'Draft') return res.status(400).json({ message: 'Only draft quotations can be edited' });

    const { items, discountType, discountValue, notes, terms, validUntil, deliveryDate } = req.body;

    if (items) {
      const processedItems = items.map(item => {
        const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        return { ...item, lineTotal: Math.round(lineTotal * 100) / 100 };
      });
      const subtotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const dtype = discountType || quotation.discountType;
      const dval = discountValue !== undefined ? discountValue : quotation.discountValue;
      let discountAmount = dtype === 'percentage' ? subtotal * (dval / 100) : dval;
      discountAmount = Math.round(discountAmount * 100) / 100;

      quotation.items = processedItems;
      quotation.subtotal = subtotal;
      quotation.discountType = dtype;
      quotation.discountValue = dval;
      quotation.discountAmount = discountAmount;
      quotation.grandTotal = Math.round((subtotal - discountAmount) * 100) / 100;
    }

    if (notes !== undefined) quotation.notes = notes;
    if (terms !== undefined) quotation.terms = terms;
    if (validUntil) quotation.validUntil = validUntil;
    if (deliveryDate) quotation.deliveryDate = deliveryDate;

    await quotation.save();
    const populated = await Quotation.findById(quotation._id)
      .populate('customer').populate('createdBy', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    const validTransitions = {
      'Draft': ['Sent'],
      'Sent': ['Accepted', 'Rejected', 'Expired'],
      'Accepted': ['Converted'],
      'Rejected': [],
      'Expired': [],
      'Converted': []
    };

    if (!validTransitions[quotation.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot change from ${quotation.status} to ${status}` });
    }

    quotation.status = status;
    await quotation.save();
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.convertToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (quotation.status !== 'Accepted') return res.status(400).json({ message: 'Only accepted quotations can be converted' });

    const settings = await Settings.findOne();
    const invoiceNumber = await generateInvoiceNumber(settings?.invoicePrefix || 'KG');

    const customerDoc = await Customer.findById(quotation.customer._id);

    const processedItems = [];
    for (const item of quotation.items) {
      let orderNumber = '';
      if (item.orderType) {
        const prefix = item.orderType === 'Sample' ? 'SM' : 'BLK';
        const counter = await Counter.findOneAndUpdate(
          { _id: `order_${prefix.toLowerCase()}` },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        orderNumber = `${prefix}${String(counter.seq).padStart(3, '0')}`;
      }
      processedItems.push({
        product: item.product, name: item.name, description: item.description,
        category: item.category, orderType: item.orderType, orderNumber, quantity: item.quantity,
        unitPrice: item.unitPrice, discount: item.discount, lineTotal: item.lineTotal
      });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      customer: quotation.customer._id,
      customerSnapshot: {
        name: customerDoc.name, email: customerDoc.email,
        phone: customerDoc.phone, address: customerDoc.address, company: customerDoc.company
      },
      items: processedItems,
      subtotal: quotation.subtotal,
      discountType: quotation.discountType,
      discountValue: quotation.discountValue,
      discountAmount: quotation.discountAmount,
      grandTotal: quotation.grandTotal,
      status: 'Draft',
      invoiceDate: new Date(),
      deliveryDate: req.body.deliveryDate || undefined,
      paymentType: req.body.paymentType || 'Cash',
      notes: quotation.notes,
      terms: quotation.terms,
      createdBy: req.user._id,
      pdfFilename: `${customerDoc.name.replace(/[^a-zA-Z0-9]/g, '_')}_${invoiceNumber}.pdf`
    });

    await Customer.findByIdAndUpdate(quotation.customer._id, {
      $inc: { totalInvoices: 1, totalSpent: quotation.grandTotal }
    });

    const ordersToCreate = processedItems
      .filter(item => item.orderNumber)
      .map(item => ({
        orderNumber: item.orderNumber,
        invoice: invoice._id,
        invoiceNumber,
        customer: quotation.customer._id,
        customerSnapshot: {
          title: customerDoc.title || '',
          name: customerDoc.name,
          phone: customerDoc.phone
        },
        productName: item.name,
        category: item.category,
        orderType: item.orderType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        invoiceDate: invoice.invoiceDate,
        deliveryDate: invoice.deliveryDate,
        status: 'Pending'
      }));
    if (ordersToCreate.length > 0) {
      await Order.insertMany(ordersToCreate);
    }

    quotation.status = 'Converted';
    quotation.convertedInvoice = invoice._id;
    await quotation.save();

    res.json({ message: 'Quotation converted to invoice', invoice, quotation });
  } catch (error) {
    console.error('Convert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (quotation.status !== 'Draft') return res.status(400).json({ message: 'Only draft quotations can be deleted' });

    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quotation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
