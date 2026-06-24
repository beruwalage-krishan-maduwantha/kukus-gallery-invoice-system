const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');

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
      quotationByStatus: qStatusMap,
      quotations: allQuotations
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
