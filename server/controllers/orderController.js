const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
  try {
    const { search, status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.invoiceDate = {};
      if (dateFrom) query.invoiceDate.$gte = new Date(dateFrom);
      if (dateTo) query.invoiceDate.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.approved = true;
    order.approvedAt = new Date();
    order.approvedBy = req.user._id;
    await order.save();

    const populated = await Order.findById(order._id).populate('approvedBy', 'name');
    res.json(populated);
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
