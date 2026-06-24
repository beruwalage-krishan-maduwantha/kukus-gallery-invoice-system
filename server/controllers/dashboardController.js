const Invoice = require('../models/Invoice');
const CreditNote = require('../models/CreditNote');
const Quotation = require('../models/Quotation');

exports.getStats = async (req, res) => {
  try {
    const totalInvoices = await Invoice.countDocuments();

    const revenueResult = await Invoice.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const outstandingResult = await Invoice.aggregate([
      { $match: { status: { $in: ['Sent', 'Overdue'] } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const outstanding = outstandingResult[0]?.total || 0;

    const creditResult = await CreditNote.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalCredits = creditResult[0]?.total || 0;
    const creditCount = creditResult[0]?.count || 0;

    const statusCounts = await Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byStatus = {};
    statusCounts.forEach(s => { byStatus[s._id] = s.count; });

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Invoice.aggregate([
      { $match: { status: 'Paid', paidDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$paidDate' }, month: { $month: '$paidDate' } },
          total: { $sum: '$grandTotal' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const recentInvoices = await Invoice.find()
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNumber customerSnapshot grandTotal status invoiceDate createdAt');

    const totalQuotations = await Quotation.countDocuments();
    const pendingQuotations = await Quotation.countDocuments({ status: { $in: ['Draft', 'Sent'] } });

    res.json({
      totalInvoices,
      totalRevenue,
      outstanding,
      totalCredits,
      creditCount,
      totalQuotations,
      pendingQuotations,
      byStatus,
      monthlyRevenue,
      recentInvoices
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
