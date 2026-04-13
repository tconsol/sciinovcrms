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
      enum: ['Speaker', 'Attendee', 'Sponsor'],
      required: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    abstract: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'PAID', 'DECLINED', 'NEXT_EDITION_INTEREST'],
      default: 'REGISTERED',
    },
    conferenceId: {
      type: String,
    },
    conferenceName: {
      type: String,
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

clientSchema.index({ email: 1, conferenceId: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ createdBy: 1 });
clientSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Client', clientSchema);
