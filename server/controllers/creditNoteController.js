const CreditNote = require('../models/CreditNote');
const Customer = require('../models/Customer');

exports.getCreditNotes = async (req, res) => {
  try {
    const { customer, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (customer) query.customer = customer;
    if (status) query.status = status;

    const total = await CreditNote.countDocuments(query);
    const creditNotes = await CreditNote.find(query)
      .populate('customer', 'name phone email company')
      .populate('invoice', 'invoiceNumber')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ creditNotes, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCustomerCredits = async (req, res) => {
  try {
    const credits = await CreditNote.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: '$customer',
          totalCredits: { $sum: '$amount' },
          creditCount: { $sum: 1 }
        }
      },
      { $sort: { totalCredits: -1 } }
    ]);

    const customerIds = credits.map(c => c._id);
    const customers = await Customer.find({ _id: { $in: customerIds } }).select('name phone email company');

    const result = credits.map(c => {
      const cust = customers.find(cu => cu._id.toString() === c._id.toString());
      return {
        customer: cust,
        totalCredits: c.totalCredits,
        creditCount: c.creditCount
      };
    });

    const totalActiveAmount = credits.reduce((sum, c) => sum + c.totalCredits, 0);

    res.json({ customerCredits: result, totalActiveAmount, totalCustomers: result.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCreditNote = async (req, res) => {
  try {
    const { customer, invoice, amount, reason, notes } = req.body;

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) return res.status(404).json({ message: 'Customer not found' });

    const creditNote = await CreditNote.create({
      customer, invoice: invoice || undefined,
      amount, reason, notes,
      createdBy: req.user._id
    });

    const populated = await CreditNote.findById(creditNote._id)
      .populate('customer', 'name phone email company')
      .populate('invoice', 'invoiceNumber')
      .populate('createdBy', 'name');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCreditNote = async (req, res) => {
  try {
    const creditNote = await CreditNote.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate('customer', 'name phone email company');

    if (!creditNote) return res.status(404).json({ message: 'Credit note not found' });
    res.json(creditNote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCreditNote = async (req, res) => {
  try {
    const creditNote = await CreditNote.findByIdAndDelete(req.params.id);
    if (!creditNote) return res.status(404).json({ message: 'Credit note not found' });
    res.json({ message: 'Credit note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
