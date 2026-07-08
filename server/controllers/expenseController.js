const Expense = require('../models/Expense');
const ExpenseAttachment = require('../models/ExpenseAttachment');

const MAX_ATTACHMENT_BYTES = 7 * 1024 * 1024;

async function saveAttachment(expense, attachment) {
  // attachment: { name, type, data } with data as base64
  const buffer = Buffer.from(attachment.data, 'base64');
  if (buffer.length > MAX_ATTACHMENT_BYTES) {
    const err = new Error('Attachment too large (max 7 MB)');
    err.status = 400;
    throw err;
  }
  await ExpenseAttachment.deleteMany({ expense: expense._id });
  await ExpenseAttachment.create({
    expense: expense._id,
    filename: attachment.name || 'attachment',
    mimeType: attachment.type || 'application/octet-stream',
    size: buffer.length,
    data: buffer
  });
  expense.attachment = {
    filename: attachment.name || 'attachment',
    mimeType: attachment.type || 'application/octet-stream',
    size: buffer.length
  };
  await expense.save();
}

exports.getExpenses = async (req, res) => {
  try {
    const { search, category, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('createdBy', 'name')
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      expenses, total,
      totalAmount: totalAmount[0]?.total || 0,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('createdBy', 'name');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { attachment, ...body } = req.body;
    const expense = await Expense.create({ ...body, createdBy: req.user._id });
    if (attachment?.data) await saveAttachment(expense, attachment);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Server error' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { attachment, removeAttachment, ...body } = req.body;
    const expense = await Expense.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (attachment?.data) {
      await saveAttachment(expense, attachment);
    } else if (removeAttachment) {
      await ExpenseAttachment.deleteMany({ expense: expense._id });
      expense.attachment = { filename: '', mimeType: '', size: 0 };
      await expense.save();
    }
    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Server error' });
  }
};

exports.getAttachment = async (req, res) => {
  try {
    const attachment = await ExpenseAttachment.findOne({ expense: req.params.id });
    if (!attachment) return res.status(404).json({ message: 'No attachment' });
    res.set('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`);
    res.send(attachment.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await ExpenseAttachment.deleteMany({ expense: req.params.id });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
