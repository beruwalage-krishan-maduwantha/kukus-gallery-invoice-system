const Order = require('../models/Order');
const OrderAttachment = require('../models/OrderAttachment');

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const SIZE_KEYS = {
  women: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl'],
  kids: ['age1_2', 'age2_3', 'age3_4', 'age5_6', 'age7_8', 'age9_10', 'age10_11', 'age12_13', 'age14_15']
};

async function saveJobSheetImage(orderId, kind, image, designIndex = 0, index = 0) {
  // image: { name, type, data } with data as base64
  const buffer = Buffer.from(image.data, 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) {
    const err = new Error('Image too large (max 4 MB)');
    err.status = 400;
    throw err;
  }
  await OrderAttachment.findOneAndUpdate(
    { order: orderId, kind, designIndex, index },
    {
      filename: image.name || `${kind}.jpg`,
      mimeType: image.type || 'image/jpeg',
      size: buffer.length,
      data: buffer
    },
    { upsert: true }
  );
  return { filename: image.name || `${kind}.jpg`, mimeType: image.type || 'image/jpeg', index };
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

    const { jobSheet = {} } = req.body;
    const current = order.toObject().jobSheet || {};
    const currentDesignsByIndex = new Map((current.designs || []).map(d => [d.designIndex, d]));

    const incomingDesigns = Array.isArray(jobSheet.designs) ? jobSheet.designs : [];
    let nextDesignIndex = current.designs?.length ? Math.max(...current.designs.map(d => d.designIndex)) + 1 : 0;

    const finalDesigns = [];
    for (const d of incomingDesigns) {
      const isNewBlock = d.designIndex === undefined || d.designIndex === null;
      const designIndex = isNewBlock ? nextDesignIndex++ : Number(d.designIndex);
      const existing = currentDesignsByIndex.get(designIndex) || { designImages: [], materialImage: { filename: '', mimeType: '' } };

      const removeSet = new Set((d.removeDesignImageIndexes || []).map(Number));
      let keptImages = (existing.designImages || []).filter(img => !removeSet.has(img.index));
      if (removeSet.size) {
        await OrderAttachment.deleteMany({ order: order._id, kind: 'design', designIndex, index: { $in: [...removeSet] } });
      }
      if (Array.isArray(d.newDesignImages) && d.newDesignImages.length) {
        let nextImgIndex = keptImages.length ? Math.max(...keptImages.map(im => im.index)) + 1 : 0;
        for (const img of d.newDesignImages) {
          if (!img?.data) continue;
          const saved = await saveJobSheetImage(order._id, 'design', img, designIndex, nextImgIndex);
          keptImages.push(saved);
          nextImgIndex += 1;
        }
      }

      const sizeType = d.sizeType === 'kids' ? 'kids' : 'women';
      const allowedKeys = SIZE_KEYS[sizeType];

      // existing material rows; old single-material records map to row 0
      // (their image attachment already lives at kind=material, index=0)
      const existingMaterials = existing.materials?.length
        ? existing.materials
        : (existing.materialImage?.filename
            ? [{ index: 0, image: existing.materialImage, sizes: existing.sizeBreakdown || {} }]
            : []);
      const existingMatsByIndex = new Map(existingMaterials.map(m => [m.index, m]));
      let nextMatIndex = existingMaterials.length ? Math.max(...existingMaterials.map(m => m.index)) + 1 : 0;

      const finalMaterials = [];
      for (const m of (Array.isArray(d.materials) ? d.materials : [])) {
        const isNewRow = m.index === undefined || m.index === null;
        const matIndex = isNewRow ? nextMatIndex++ : Number(m.index);
        const prev = existingMatsByIndex.get(matIndex);

        let image = prev?.image || { filename: '', mimeType: '' };
        if (m.image?.data) {
          const saved = await saveJobSheetImage(order._id, 'material', m.image, designIndex, matIndex);
          image = { filename: saved.filename, mimeType: saved.mimeType };
        } else if (m.removeImage) {
          await OrderAttachment.deleteOne({ order: order._id, kind: 'material', designIndex, index: matIndex });
          image = { filename: '', mimeType: '' };
        }

        const sizes = {};
        for (const key of allowedKeys) sizes[key] = Number(m.sizes?.[key]) || 0;

        // keep rows that have an image or at least one quantity
        if (image.filename || Object.values(sizes).some(v => v > 0)) {
          finalMaterials.push({ index: matIndex, image, sizes });
        } else if (!isNewRow) {
          await OrderAttachment.deleteOne({ order: order._id, kind: 'material', designIndex, index: matIndex });
        }
      }

      // clean up attachments for material rows removed in the UI
      const keptMatIndexes = new Set(finalMaterials.map(m => m.index));
      for (const em of existingMaterials) {
        if (!keptMatIndexes.has(em.index)) {
          await OrderAttachment.deleteOne({ order: order._id, kind: 'material', designIndex, index: em.index });
        }
      }

      finalDesigns.push({
        designIndex,
        designImages: keptImages,
        sizeType,
        materials: finalMaterials,
        notes: d.notes || '',
        // legacy fields cleared once migrated to materials rows
        materialImage: { filename: '', mimeType: '' },
        sizeBreakdown: {}
      });
    }

    // Any design blocks that existed before but weren't resubmitted were removed in the UI - clean up their images
    const incomingIndexSet = new Set(finalDesigns.map(d => d.designIndex));
    const removedBlocks = (current.designs || []).filter(d => !incomingIndexSet.has(d.designIndex));
    for (const rb of removedBlocks) {
      await OrderAttachment.deleteMany({ order: order._id, designIndex: rb.designIndex });
    }

    order.jobSheet = {
      filled: true,
      designs: finalDesigns,
      trims: Array.isArray(jobSheet.trims)
        ? jobSheet.trims.filter(t => (t.item || '').trim()).map(t => ({ item: t.item || '', quantity: t.quantity || '' }))
        : [],
      notes: '',
      // legacy fields no longer written
      sizeOption: '', sizeBreakdown: [], designImage: { filename: '', mimeType: '' }, designImages: [], materialImage: { filename: '', mimeType: '' }
    };

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
    const designIndex = Number(req.params.designIndex) || 0;
    const index = Number(req.params.index) || 0;
    const attachment = await OrderAttachment.findOne({ order: req.params.id, kind, designIndex, index });
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
