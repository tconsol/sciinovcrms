const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema(
  {
    logo: {
      data: { type: Buffer },
      contentType: { type: String },
      filename: { type: String },
      size: { type: Number },
    },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
