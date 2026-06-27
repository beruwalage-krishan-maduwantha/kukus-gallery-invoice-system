const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const Order = require('../models/Order');

exports.getReport = async (req, res) => {
  try {
    // Total Quotations
    const totalQuotations = await Quotation.countDocuments();

    // Each quotation with value
    const allQuotations = await Quotation.find()
      .populate('customer', 'name phone')
      .populate('convertedInvoice', 'invoiceNumber')
      .select('quotationNumber customerSnapshot grandTotal status quotationDate validUntil convertedInvoice')
      .sort('-quotationDate');

    // Total quotation value
    const quotationValueResult = await Quotation.aggregate([
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalQuotationValue = quotationValueResult[0]?.total || 0;

    // Quotations converted to sell (invoice)
    const convertedCount = await Quotation.countDocuments({ status: 'Converted' });
    const convertedValueResult = await Quotation.aggregate([
      { $match: { status: 'Converted' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalConvertedValue = convertedValueResult[0]?.total || 0;

    // Total Invoices
    const totalInvoices = await Invoice.countDocuments();

    // Total invoice value (all invoices)
    const invoiceValueResult = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalInvoiceValue = invoiceValueResult[0]?.total || 0;

    // Total sell (paid invoices)
    const paidResult = await Invoice.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);
    const totalSell = paidResult[0]?.total || 0;
    const paidCount = paidResult[0]?.count || 0;

    // Quotation status breakdown
    const quotationByStatus = await Quotation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$grandTotal' } } }
    ]);
    const qStatusMap = {};
    quotationByStatus.forEach(s => { qStatusMap[s._id] = { count: s.count, value: s.value }; });

    // Conversion rate
    const conversionRate = totalQuotations > 0 ? Math.round((convertedCount / totalQuotations) * 100) : 0;

    const advancePaidCount = await Invoice.countDocuments({ status: 'Advance Paid' });
    const overdueCount = await Invoice.countDocuments({ status: 'Overdue' });

    const allInvoices = await Invoice.find()
      .select('invoiceNumber customerSnapshot grandTotal advancePayment balance status invoiceDate')
      .sort('-invoiceDate');

    const totalOrders = await Order.countDocuments();
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const orderStatusMap = {};
    ordersByStatus.forEach(s => { orderStatusMap[s._id] = s.count; });

    const approvedOrders = await Order.countDocuments({ approved: true });

    const allOrders = await Order.find()
      .populate('approvedBy', 'name')
      .select('orderNumber productName category orderType customerSnapshot invoiceNumber invoice invoiceDate deliveryDate status approved approvedAt approvedBy quantity unitPrice')
      .sort('-createdAt');

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
      orders: allOrders
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
