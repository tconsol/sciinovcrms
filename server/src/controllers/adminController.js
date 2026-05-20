const ConferenceConfig = require('../models/ConferenceConfig');
const RoleConfig = require('../models/RoleConfig');
const StatusConfig = require('../models/StatusConfig');
const PaymentModeConfig = require('../models/PaymentModeConfig');
const socket = require('../socket');

const DEFAULT_ROLES = [
  { name: 'Speaker', label: 'Speaker' },
  { name: 'Attendee', label: 'Attendee' },
  { name: 'Sponsor', label: 'Sponsor' },
];

const DEFAULT_STATUSES = [
  { name: 'REGISTERED', label: 'Registered', color: 'blue' },
  { name: 'PAID', label: 'Paid', color: 'green' },
  { name: 'DECLINED', label: 'Declined', color: 'red' },
  { name: 'NEXT_EDITION_INTEREST', label: 'Next Edition Interest', color: 'amber' },
];

// ─── Conferences ────────────────────────────────────────────────
exports.getConferences = async (req, res) => {
  try {
    const conferences = await ConferenceConfig.find().sort({ createdAt: -1 });
    res.json(conferences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createConference = async (req, res) => {
  try {
    const conference = await ConferenceConfig.create({
      ...req.body,
      createdBy: req.user.userId,
    });
    socket.emit('admin:changed');
    res.status(201).json(conference);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateConference = async (req, res) => {
  try {
    const conference = await ConferenceConfig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!conference) return res.status(404).json({ message: 'Conference not found' });
    socket.emit('admin:changed');
    res.json(conference);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteConference = async (req, res) => {
  try {
    const conference = await ConferenceConfig.findByIdAndDelete(req.params.id);
    if (!conference) return res.status(404).json({ message: 'Conference not found' });
    socket.emit('admin:changed');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Roles ──────────────────────────────────────────────────────
exports.getRoles = async (req, res) => {
  try {
    let roles = await RoleConfig.find().sort({ createdAt: 1 });
    if (roles.length === 0) {
      roles = await RoleConfig.insertMany(DEFAULT_ROLES.map((r) => ({ ...r, createdBy: 'system' })));
    }
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const role = await RoleConfig.create({ ...req.body, createdBy: req.user.userId });
    socket.emit('admin:changed');
    res.status(201).json(role);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Role already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await RoleConfig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    socket.emit('admin:changed');
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await RoleConfig.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    socket.emit('admin:changed');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Statuses ───────────────────────────────────────────────────
exports.getStatuses = async (req, res) => {
  try {
    let statuses = await StatusConfig.find().sort({ createdAt: 1 });
    if (statuses.length === 0) {
      statuses = await StatusConfig.insertMany(DEFAULT_STATUSES.map((s) => ({ ...s, createdBy: 'system' })));
    }
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStatus = async (req, res) => {
  try {
    const status = await StatusConfig.create({ ...req.body, createdBy: req.user.userId });
    socket.emit('admin:changed');
    res.status(201).json(status);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Status already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const status = await StatusConfig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!status) return res.status(404).json({ message: 'Status not found' });
    socket.emit('admin:changed');
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const status = await StatusConfig.findByIdAndDelete(req.params.id);
    if (!status) return res.status(404).json({ message: 'Status not found' });
    socket.emit('admin:changed');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Payment Modes ──────────────────────────────────────────────
const DEFAULT_PAYMENT_MODES = [
  { name: 'UPI', label: 'UPI' },
  { name: 'CARD', label: 'Card' },
  { name: 'BANK', label: 'Bank Transfer' },
  { name: 'CASH', label: 'Cash' },
];

exports.getPaymentModes = async (req, res) => {
  try {
    let modes = await PaymentModeConfig.find().sort({ createdAt: 1 });
    if (modes.length === 0) {
      modes = await PaymentModeConfig.insertMany(DEFAULT_PAYMENT_MODES.map((m) => ({ ...m, createdBy: 'system' })));
    }
    res.json(modes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPaymentMode = async (req, res) => {
  try {
    const mode = await PaymentModeConfig.create({ ...req.body, createdBy: req.user.userId });
    socket.emit('admin:changed');
    res.status(201).json(mode);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Payment mode already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updatePaymentMode = async (req, res) => {
  try {
    const mode = await PaymentModeConfig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!mode) return res.status(404).json({ message: 'Payment mode not found' });
    socket.emit('admin:changed');
    res.json(mode);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePaymentMode = async (req, res) => {
  try {
    const mode = await PaymentModeConfig.findByIdAndDelete(req.params.id);
    if (!mode) return res.status(404).json({ message: 'Payment mode not found' });
    socket.emit('admin:changed');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
