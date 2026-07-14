const Client = require('../models/Client');
const logActivity = require('../utils/logActivity');
const { renderPdfBuffer, getLogoDataUri } = require('../services/pdf/letterhead');
const { buildAcceptanceLetterDefinition } = require('../services/pdf/templates/acceptanceLetter');

const REQUIRED_FIELDS = [
  'recipientName',
  'conferenceName',
  'conferenceDates',
  'conferenceLocation',
  'eventTagline',
  'shortCode',
  'paperTitle',
  'presentationType',
  'signatoryName',
];

exports.generateAcceptanceLetter = async (req, res) => {
  try {
    const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required field(s): ${missing.join(', ')}` });
    }

    const { clientId, ...fields } = req.body;

    const logoDataUri = await getLogoDataUri();
    const docDefinition = buildAcceptanceLetterDefinition({ ...fields, logoDataUri });
    const pdfBuffer = await renderPdfBuffer(docDefinition);

    let loggedClientId;
    if (clientId) {
      const client = await Client.findById(clientId).catch(() => null);
      if (client) loggedClientId = client._id;
    }

    await logActivity({
      userId: req.user.userId,
      actionType: 'DOCUMENT_GENERATED',
      description: `Generated acceptance letter for ${fields.recipientName} (${fields.conferenceName})`,
      clientId: loggedClientId,
      metadata: { docType: 'ACCEPTANCE_LETTER', paperTitle: fields.paperTitle },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="acceptance-letter-${fields.recipientName.replace(/\s+/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
