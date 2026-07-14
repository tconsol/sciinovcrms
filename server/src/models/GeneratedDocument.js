const mongoose = require('mongoose');

const generatedDocumentSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      required: true,
      trim: true,
    },
    // Form field values used to render the PDF — re-rendered on demand at
    // download time (fresh logo/settings pulled from DB each time), never
    // stored as bytes.
    fields: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

generatedDocumentSchema.index({ docType: 1 });
generatedDocumentSchema.index({ clientId: 1 });
generatedDocumentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GeneratedDocument', generatedDocumentSchema);
