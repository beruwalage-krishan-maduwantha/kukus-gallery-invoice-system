const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const Order = require('../models/Order');
const Expense = require('../models/Expense');

exports.getReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateRange = {};
    if (dateFrom) dateRange.$gte = new Date(dateFrom);
    if (dateTo) dateRange.$lte = new Date(dateTo);

    const quotationMatch = Object.keys(dateRange).length ? { quotationDate: dateRange } : {};
    const invoiceMatch = Object.keys(dateRange).length ? { invoiceDate: dateRange } : {};
    const orderMatch = Object.keys(dateRange).length ? { invoiceDate: dateRange } : {};
    const expenseMatch = Object.keys(dateRange).length ? { date: dateRange } : {};

    // Total Quotations
    const totalQuotations = await Quotation.countDocuments(quotationMatch);

    // Each quotation with value
    const allQuotations = await Quotation.find(quotationMatch)
      .populate('customer', 'name phone')
      .populate('convertedInvoice', 'invoiceNumber')
      .select('quotationNumber customerSnapshot grandTotal status quotationDate validUntil convertedInvoice')
      .sort('-quotationDate');

    // Total quotation value
    const quotationValueResult = await Quotation.aggregate([
      { $match: quotationMatch },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalQuotationValue = quotationValueResult[0]?.total || 0;

    // Quotations converted to sell (invoice)
    const convertedCount = await Quotation.countDocuments({ ...quotationMatch, status: 'Converted' });
    const convertedValueResult = await Quotation.aggregate([
      { $match: { ...quotationMatch, status: 'Converted' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalConvertedValue = convertedValueResult[0]?.total || 0;

    // Total Invoices
    const totalInvoices = await Invoice.countDocuments(invoiceMatch);

    // Total invoice value (all invoices)
    const invoiceValueResult = await Invoice.aggregate([
      { $match: invoiceMatch },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalInvoiceValue = invoiceValueResult[0]?.total || 0;

    // Total sell (paid invoices)
    const paidResult = await Invoice.aggregate([
      { $match: { ...invoiceMatch, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);
    const totalSell = paidResult[0]?.total || 0;
    const paidCount = paidResult[0]?.count || 0;

    // Quotation status breakdown
    const quotationByStatus = await Quotation.aggregate([
      { $match: quotationMatch },
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$grandTotal' } } }
    ]);
    const qStatusMap = {};
    quotationByStatus.forEach(s => { qStatusMap[s._id] = { count: s.count, value: s.value }; });

    // Conversion rate
    const conversionRate = totalQuotations > 0 ? Math.round((convertedCount / totalQuotations) * 100) : 0;

    const advancePaidCount = await Invoice.countDocuments({ ...invoiceMatch, status: 'Advance Paid' });
    const overdueCount = await Invoice.countDocuments({ ...invoiceMatch, status: 'Overdue' });

    const allInvoices = await Invoice.find(invoiceMatch)
      .select('invoiceNumber customerSnapshot grandTotal advancePayment balance status invoiceDate')
      .sort('-invoiceDate');

    const totalOrders = await Order.countDocuments(orderMatch);
    const ordersByStatus = await Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const orderStatusMap = {};
    ordersByStatus.forEach(s => { orderStatusMap[s._id] = s.count; });

    const approvedOrders = await Order.countDocuments({ ...orderMatch, approved: true });

    const allOrders = await Order.find(orderMatch)
      .populate('approvedBy', 'name')
      .select('orderNumber productName category orderType customerSnapshot invoiceNumber invoice invoiceDate deliveryDate status approved approvedAt approvedBy quantity unitPrice')
      .sort('-createdAt');

    const totalExpensesResult = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = totalExpensesResult[0]?.total || 0;

    const expensesByCategory = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const allExpenses = await Expense.find(expenseMatch)
      .populate('createdBy', 'name')
      .select('title category amount date paymentMethod reference')
      .sort('-date');

    res.json({
      totalQuotations,
      totalQuotationValue,
      convertedCount,
      totalConvertedValue,
      conversionRate,
      totalInvoices,
      totalInvoiceValue,
      totalSell,
      paidCount,
      advancePaidCount,
      overdueCount,
      quotationByStatus: qStatusMap,
      quotations: allQuotations,
      invoices: allInvoices,
      totalOrders,
      ordersByStatus: orderStatusMap,
      approvedOrders,
      orders: allOrders,
      totalExpenses,
      expensesByCategory,
      expenses: allExpenses,
      profit: totalSell - totalExpenses
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
