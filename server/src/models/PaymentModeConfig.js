const mongoose = require('mongoose');

const paymentModeConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  label: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: 'system' },
}, { timestamps: true });

module.exports = mongoose.model('PaymentModeConfig', paymentModeConfigSchema);
