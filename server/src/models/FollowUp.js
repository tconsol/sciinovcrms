const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    followUpDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED'],
      default: 'PENDING',
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

followUpSchema.index({ clientId: 1 });
followUpSchema.index({ followUpDate: 1, status: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
