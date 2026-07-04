const Invoice = require('../models/Invoice');
const CreditNote = require('../models/CreditNote');
const Quotation = require('../models/Quotation');
const Order = require('../models/Order');
const Expense = require('../models/Expense');

exports.getStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateRange = {};
    if (dateFrom) dateRange.$gte = new Date(dateFrom);
    if (dateTo) dateRange.$lte = new Date(dateTo);
    const hasFilter = Object.keys(dateRange).length > 0;

    const invoiceMatch = hasFilter ? { invoiceDate: dateRange } : {};
    const quotationMatch = hasFilter ? { quotationDate: dateRange } : {};
    const orderMatch = hasFilter ? { invoiceDate: dateRange } : {};
    const expenseMatch = hasFilter ? { date: dateRange } : {};
    const creditMatch = hasFilter ? { createdAt: dateRange } : {};

    const totalInvoices = await Invoice.countDocuments(invoiceMatch);

    const paidResult = await Invoice.aggregate([
      { $match: { ...invoiceMatch, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const advanceFromUnpaid = await Invoice.aggregate([
      { $match: { ...invoiceMatch, status: { $in: ['Sent', 'Advance Paid', 'Overdue', 'Draft'] }, advancePayment: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$advancePayment' } } }
    ]);
    const totalRevenue = (paidResult[0]?.total || 0) + (advanceFromUnpaid[0]?.total || 0);

    const outstandingResult = await Invoice.aggregate([
      { $match: { ...invoiceMatch, status: { $in: ['Sent', 'Advance Paid', 'Overdue'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$grandTotal', { $ifNull: ['$advancePayment', 0] }] } } } }
    ]);
    const outstanding = outstandingResult[0]?.total || 0;

    const creditResult = await CreditNote.aggregate([
      { $match: { ...creditMatch, status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalCredits = creditResult[0]?.total || 0;
    const creditCount = creditResult[0]?.count || 0;

    const totalQuotations = await Quotation.countDocuments(quotationMatch);
    const pendingQuotations = await Quotation.countDocuments({ ...quotationMatch, status: { $in: ['Draft', 'Sent'] } });

    const statusCounts = await Invoice.aggregate([
      { $match: invoiceMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byStatus = {};
    statusCounts.forEach(s => { byStatus[s._id] = s.count; });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeStart = hasFilter && dateFrom ? new Date(dateFrom) : monthStart;
    const rangeEnd = hasFilter && dateTo ? new Date(dateTo) : null;
    const weeklyRevenue = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(rangeStart);
      weekStart.setDate(weekStart.getDate() + (w * 7));
      const weekEnd = new Date(rangeStart);
      weekEnd.setDate(weekEnd.getDate() + ((w + 1) * 7));
      if (w === 3) {
        if (rangeEnd) weekEnd.setTime(rangeEnd.getTime());
        else weekEnd.setMonth(weekEnd.getMonth() + 1, 0, 23, 59, 59);
      }

      const result = await Invoice.aggregate([
        { $match: { status: 'Paid', invoiceDate: { $gte: weekStart, $lt: weekEnd } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]);
      weeklyRevenue.push({ week: `Week ${w + 1}`, total: result[0]?.total || 0 });
    }

    const recentInvoices = await Invoice.find(invoiceMatch)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNumber customerSnapshot grandTotal advancePayment balance status invoiceDate createdAt');

    const totalOrders = await Order.countDocuments(orderMatch);
    const ordersByStatus = await Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const orderStatusMap = {};
    ordersByStatus.forEach(s => { orderStatusMap[s._id] = s.count; });
    const pendingOrders = orderStatusMap['Pending'] || 0;

    const recentOrders = await Order.find(orderMatch)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber productName customerSnapshot invoiceNumber invoice status approved deliveryDate createdAt');

    const expenseResult = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expenseResult[0]?.total || 0;
    const profit = totalRevenue - totalExpenses;

    const monthExpenses = await Expense.aggregate([
      { $match: hasFilter ? expenseMatch : { date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const thisMonthExpenses = monthExpenses[0]?.total || 0;

    res.json({
      totalInvoices, totalRevenue, outstanding,
      totalCredits, creditCount,
      totalQuotations, pendingQuotations,
      byStatus, weeklyRevenue, recentInvoices,
      totalOrders, pendingOrders, orderStatusMap, recentOrders,
      totalExpenses, profit, thisMonthExpenses
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
