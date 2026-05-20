const mongoose = require('mongoose');

const conferenceConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date },
    location: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConferenceConfig', conferenceConfigSchema);
