const Order = require('../models/Order');
const OrderAttachment = require('../models/OrderAttachment');

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function saveJobSheetImage(orderId, kind, image) {
  // image: { name, type, data } with data as base64
  const buffer = Buffer.from(image.data, 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) {
    const err = new Error('Image too large (max 4 MB)');
    err.status = 400;
    throw err;
  }
  await OrderAttachment.findOneAndUpdate(
    { order: orderId, kind },
    {
      filename: image.name || `${kind}.jpg`,
      mimeType: image.type || 'image/jpeg',
      size: buffer.length,
      data: buffer
    },
    { upsert: true }
  );
  return { filename: image.name || `${kind}.jpg`, mimeType: image.type || 'image/jpeg' };
}

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
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ invoiceDate: -1, orderNumber: 1 })
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

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await OrderAttachment.deleteMany({ order: req.params.id });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateJobSheet = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const { jobSheet = {}, designImage, materialImage, removeDesignImage, removeMaterialImage } = req.body;
    const current = order.toObject().jobSheet || {};

    order.jobSheet = {
      filled: true,
      sizeOption: jobSheet.sizeOption || '',
      sizeBreakdown: Array.isArray(jobSheet.sizeBreakdown)
        ? jobSheet.sizeBreakdown
            .filter(r => (r.color || '').trim() || r.s || r.m || r.l || r.xl || r.xxl)
            .map(r => ({ color: r.color || '', s: Number(r.s) || 0, m: Number(r.m) || 0, l: Number(r.l) || 0, xl: Number(r.xl) || 0, xxl: Number(r.xxl) || 0 }))
        : [],
      trims: Array.isArray(jobSheet.trims)
        ? jobSheet.trims.filter(t => (t.quantity || '').trim()).map(t => ({ item: t.item || '', quantity: t.quantity || '' }))
        : [],
      notes: jobSheet.notes || '',
      designImage: current.designImage || { filename: '', mimeType: '' },
      materialImage: current.materialImage || { filename: '', mimeType: '' }
    };

    if (designImage?.data) {
      order.jobSheet.designImage = await saveJobSheetImage(order._id, 'design', designImage);
    } else if (removeDesignImage) {
      await OrderAttachment.deleteOne({ order: order._id, kind: 'design' });
      order.jobSheet.designImage = { filename: '', mimeType: '' };
    }
    if (materialImage?.data) {
      order.jobSheet.materialImage = await saveJobSheetImage(order._id, 'material', materialImage);
    } else if (removeMaterialImage) {
      await OrderAttachment.deleteOne({ order: order._id, kind: 'material' });
      order.jobSheet.materialImage = { filename: '', mimeType: '' };
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Update job sheet error:', error);
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Server error' });
  }
};

exports.getJobSheetImage = async (req, res) => {
  try {
    const kind = req.params.kind === 'material' ? 'material' : 'design';
    const attachment = await OrderAttachment.findOne({ order: req.params.id, kind });
    if (!attachment) return res.status(404).json({ message: 'No image' });
    res.set('Content-Type', attachment.mimeType || 'image/jpeg');
    res.send(attachment.data);
  } catch (error) {
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
