const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    topics: {
      type: [String],
      default: [],
    },
    profileImage: {
      type: String,
    },
    status: {
      type: String,
      default: 'REGISTERED',
      trim: true,
    },
    conferenceNames: {
      type: [String],
      default: [],
    },
    conversationVia: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
clientSchema.index({ status: 1 });
clientSchema.index({ createdBy: 1 });
clientSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Client', clientSchema);
