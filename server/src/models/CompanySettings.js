const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema(
  {
    logo: {
      data: { type: Buffer },
      contentType: { type: String },
      filename: { type: String },
      size: { type: Number },
    },
    orgName: { type: String, trim: true },
    orgWebsite: { type: String, trim: true },
    contactAddress: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactWhatsapp: { type: String, trim: true },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
