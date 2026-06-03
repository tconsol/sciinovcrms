const mongoose = require('mongoose');

const conversationViaConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    label: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConversationViaConfig', conversationViaConfigSchema);
