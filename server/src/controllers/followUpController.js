const FollowUp = require('../models/FollowUp');
const Client = require('../models/Client');
const logActivity = require('../utils/logActivity');
const socket = require('../socket');

exports.createFollowUp = async (req, res) => {
  try {
    const { clientId, outcome } = req.body;

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
      description: `Conversation logged for ${client.fullName}`,
      clientId: client._id,
    });

    // A conversation's outcome represents the client's latest known status —
    // keep Client.status in sync so lists/dashboards don't show a stale value.
    if (outcome && outcome !== client.status) {
      const oldStatus = client.status;
      await Client.findByIdAndUpdate(clientId, { status: outcome });
      await logActivity({
        userId: req.user.userId,
        actionType: 'STATUS_CHANGED',
        description: `Status changed from ${oldStatus} to ${outcome} for ${client.fullName}`,
        clientId: client._id,
        metadata: { oldStatus, newStatus: outcome },
      });
      socket.emit('clients:changed');
    }

    socket.emit('followups:changed');
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
    const { page = 1, limit = 10, status, overdue, conference, topic, outcome, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (conference) filter.conference = conference;
    if (topic) filter.topic = topic;
    if (outcome) filter.outcome = outcome;
    if (overdue === 'true') {
      filter.followUpDate = { $lt: new Date() };
      filter.status = 'PENDING';
    }
    if (search) {
      const matchingClients = await Client.find(
        { fullName: { $regex: search, $options: 'i' }, isDeleted: false },
        '_id'
      );
      filter.clientId = { $in: matchingClients.map((c) => c._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [followUps, total] = await Promise.all([
      FollowUp.find(filter)
        .populate('clientId', 'fullName email role status')
        .sort({ followUpDate: -1 })
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
    const existing = await FollowUp.findById(req.params.id).select('status outcome clientId');
    if (req.body.status === 'COMPLETED' && existing?.status !== 'COMPLETED') {
      req.body.completedBy = req.user.userId;
      req.body.completedAt = new Date();
    }

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
        description: `Conversation marked complete for client`,
        clientId: followUp.clientId,
      });
    } else {
      await logActivity({
        userId: req.user.userId,
        actionType: 'FOLLOWUP_UPDATED',
        description: `Conversation updated`,
        clientId: followUp.clientId,
      });
    }

    // Keep Client.status in sync when this conversation's outcome changes.
    if (req.body.outcome && req.body.outcome !== existing?.outcome) {
      const client = await Client.findOne({ _id: followUp.clientId, isDeleted: false });
      if (client && client.status !== req.body.outcome) {
        const oldStatus = client.status;
        await Client.findByIdAndUpdate(client._id, { status: req.body.outcome });
        await logActivity({
          userId: req.user.userId,
          actionType: 'STATUS_CHANGED',
          description: `Status changed from ${oldStatus} to ${req.body.outcome} for ${client.fullName}`,
          clientId: client._id,
          metadata: { oldStatus, newStatus: req.body.outcome },
        });
        socket.emit('clients:changed');
      }
    }

    socket.emit('followups:changed');
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
    socket.emit('followups:changed');
    res.json({ message: 'Follow-up deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
