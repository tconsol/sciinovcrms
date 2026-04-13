const FollowUp = require('../models/FollowUp');
const Client = require('../models/Client');
const logActivity = require('../utils/logActivity');

exports.createFollowUp = async (req, res) => {
  try {
    const { clientId } = req.body;

    const client = await Client.findOne({ _id: clientId, isDeleted: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const followUp = await FollowUp.create({
      ...req.body,
      createdBy: req.user.userId,
    });

    await logActivity({
      userId: req.user.userId,
      actionType: 'FOLLOWUP_CREATED',
      description: `Follow-up scheduled for ${client.fullName}`,
      clientId: client._id,
    });

    res.status(201).json(followUp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowUpsByClient = async (req, res) => {
  try {
    const followUps = await FollowUp.find({ clientId: req.params.clientId })
      .sort({ followUpDate: 1 });
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllFollowUps = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, overdue } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (overdue === 'true') {
      filter.followUpDate = { $lt: new Date() };
      filter.status = 'PENDING';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [followUps, total] = await Promise.all([
      FollowUp.find(filter)
        .populate('clientId', 'fullName email role status')
        .sort({ followUpDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FollowUp.countDocuments(filter),
    ]);

    res.json({
      followUps,
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

exports.updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    if (req.body.status === 'COMPLETED') {
      await logActivity({
        userId: req.user.userId,
        actionType: 'FOLLOWUP_COMPLETED',
        description: `Follow-up completed for client`,
        clientId: followUp.clientId,
      });
    } else {
      await logActivity({
        userId: req.user.userId,
        actionType: 'FOLLOWUP_UPDATED',
        description: `Follow-up updated`,
        clientId: followUp.clientId,
      });
    }

    res.json(followUp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id);
    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }
    res.json({ message: 'Follow-up deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
