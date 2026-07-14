const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      enum: [
        'CLIENT_CREATED',
        'CLIENT_UPDATED',
        'CLIENT_DELETED',
        'STATUS_CHANGED',
        'PAYMENT_ADDED',
        'FOLLOWUP_CREATED',
        'FOLLOWUP_UPDATED',
        'FOLLOWUP_COMPLETED',
        'LOGO_UPDATED',
        'DOCUMENT_GENERATED',
        'SETTINGS_UPDATED',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ clientId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
