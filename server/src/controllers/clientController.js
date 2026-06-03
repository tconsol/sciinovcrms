const Client = require('../models/Client');
const FollowUp = require('../models/FollowUp');
const Payment = require('../models/Payment');
const logActivity = require('../utils/logActivity');
const socket = require('../socket');

exports.createClient = async (req, res) => {
  try {
    const normalizedEmail = (req.body.email || '').trim().toLowerCase();
    const existing = await Client.findOne({ email: normalizedEmail, isDeleted: false });
    if (existing) {
      return res.status(409).json({ message: `A client with email "${normalizedEmail}" already exists` });
    }

    const clientData = {
      ...req.body,
      email: normalizedEmail,
      createdBy: req.user.userId,
    };

    if (req.file) {
      clientData.profileImage = `/uploads/${req.file.filename}`;
    }

    const client = await Client.create(clientData);

    await logActivity({
      userId: req.user.userId,
      actionType: 'CLIENT_CREATED',
      description: `Created client: ${client.fullName}`,
      clientId: client._id,
    });

    socket.emit('clients:changed');
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      role,
      topic,
      conference,
      conferenceId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = { isDeleted: false };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (role) filter.role = role;
    if (topic) filter.topics = topic;
    if (conference) filter.conferenceNames = conference;
    if (conferenceId) filter.conferenceId = conferenceId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clients, total] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Client.countDocuments(filter),
    ]);

    res.json({
      clients,
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

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
      const duplicate = await Client.findOne({ email: updateData.email, isDeleted: false, _id: { $ne: req.params.id } });
      if (duplicate) {
        return res.status(409).json({ message: `A client with email "${updateData.email}" already exists` });
      }
    }

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const oldClient = await Client.findOne({ _id: req.params.id, isDeleted: false });
    if (!oldClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Track status change
    const statusChanged = updateData.status && updateData.status !== oldClient.status;

    const client = await Client.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await logActivity({
      userId: req.user.userId,
      actionType: statusChanged ? 'STATUS_CHANGED' : 'CLIENT_UPDATED',
      description: statusChanged
        ? `Status changed from ${oldClient.status} to ${updateData.status} for ${client.fullName}`
        : `Updated client: ${client.fullName}`,
      clientId: client._id,
      metadata: statusChanged
        ? { oldStatus: oldClient.status, newStatus: updateData.status }
        : undefined,
    });

    socket.emit('clients:changed');
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Cascade delete all related data
    await Promise.all([
      FollowUp.deleteMany({ clientId: client._id }),
      Payment.deleteMany({ clientId: client._id }),
    ]);

    await logActivity({
      userId: req.user.userId,
      actionType: 'CLIENT_DELETED',
      description: `Deleted client: ${client.fullName}`,
      clientId: client._id,
    });

    socket.emit('clients:changed');
    socket.emit('payments:changed');
    socket.emit('followups:changed');
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
