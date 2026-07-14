const CompanySettings = require('../models/CompanySettings');
const logActivity = require('../utils/logActivity');

exports.getLogo = async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    if (!settings || !settings.logo || !settings.logo.data) {
      return res.status(404).json({ message: 'No logo uploaded yet' });
    }

    res.set('Content-Type', settings.logo.contentType);
    res.set('Cache-Control', 'no-cache');
    res.send(settings.logo.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Logo file is required' });
    }

    // $set is required here — a plain update object has MongoDB *replace* semantics
    // and would wipe every other CompanySettings field (org name, contact info, etc.)
    const settings = await CompanySettings.findOneAndUpdate(
      {},
      {
        $set: {
          logo: {
            data: req.file.buffer,
            contentType: req.file.mimetype,
            filename: req.file.originalname,
            size: req.file.size,
          },
          updatedBy: req.user.userId,
        },
      },
      { new: true, upsert: true }
    );

    await logActivity({
      userId: req.user.userId,
      actionType: 'LOGO_UPDATED',
      description: `Updated company logo: ${req.file.originalname}`,
    });

    res.json({
      message: 'Logo updated successfully',
      logo: {
        filename: settings.logo.filename,
        contentType: settings.logo.contentType,
        size: settings.logo.size,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    res.json({
      hasLogo: Boolean(settings?.logo?.data),
      orgName: settings?.orgName || '',
      orgWebsite: settings?.orgWebsite || '',
      contactAddress: settings?.contactAddress || '',
      contactEmail: settings?.contactEmail || '',
      contactWhatsapp: settings?.contactWhatsapp || '',
      updatedAt: settings?.updatedAt || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { orgName, orgWebsite, contactAddress, contactEmail, contactWhatsapp } = req.body;

    const settings = await CompanySettings.findOneAndUpdate(
      {},
      { $set: { orgName, orgWebsite, contactAddress, contactEmail, contactWhatsapp, updatedBy: req.user.userId } },
      { new: true, upsert: true, runValidators: true }
    );

    await logActivity({
      userId: req.user.userId,
      actionType: 'SETTINGS_UPDATED',
      description: 'Updated company settings',
    });

    res.json({
      message: 'Settings updated successfully',
      orgName: settings.orgName,
      orgWebsite: settings.orgWebsite,
      contactAddress: settings.contactAddress,
      contactEmail: settings.contactEmail,
      contactWhatsapp: settings.contactWhatsapp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
