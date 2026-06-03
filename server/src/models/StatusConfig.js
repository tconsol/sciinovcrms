const mongoose = require('mongoose');

const statusConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    label: { type: String, trim: true },
    color: { type: String, default: 'gray' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StatusConfig', statusConfigSchema);
