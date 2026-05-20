const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    actualFee: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMode: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    conference: {
      type: String,
      trim: true,
    },
    followUpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FollowUp',
      default: null,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    refundStatus: {
      type: String,
      enum: ['NONE', 'PARTIAL', 'FULL'],
      default: 'NONE',
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

paymentSchema.index({ clientId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
