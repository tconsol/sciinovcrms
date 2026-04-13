const Payment = require('../models/Payment');
const Client = require('../models/Client');
const logActivity = require('../utils/logActivity');

exports.addPayment = async (req, res) => {
  try {
    const { clientId } = req.body;

    const client = await Client.findOne({ _id: clientId, isDeleted: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (client.status !== 'PAID') {
      return res.status(400).json({
        message: 'Payment can only be added when client status is PAID',
      });
    }

    const payment = await Payment.create({
      ...req.body,
      createdBy: req.user.userId,
    });

    await logActivity({
      userId: req.user.userId,
      actionType: 'PAYMENT_ADDED',
      description: `Payment of ${payment.amountPaid} added for ${client.fullName}`,
      clientId: client._id,
      metadata: { amountPaid: payment.amountPaid, paymentMode: payment.paymentMode },
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByClient = async (req, res) => {
  try {
    const payments = await Payment.find({ clientId: req.params.clientId })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentMode, startDate, endDate } = req.query;

    const filter = {};
    if (paymentMode) filter.paymentMode = paymentMode;
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('clientId', 'fullName email role status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter),
    ]);

    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
