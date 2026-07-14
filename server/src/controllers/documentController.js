const GeneratedDocument = require('../models/GeneratedDocument');
const logActivity = require('../utils/logActivity');
const { renderPdfBuffer, getCompanySettings } = require('../services/pdf/letterhead');
const { getDocType, listDocTypes } = require('../services/pdf/registry');

exports.getDocTypes = (_req, res) => {
  res.json(listDocTypes());
};

exports.listDocuments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.docType) filter.docType = req.query.docType;

    const documents = await GeneratedDocument.find(filter)
      .sort({ createdAt: -1 })
      .populate('clientId', 'fullName email');
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const document = await GeneratedDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const { docType, clientId, ...fields } = req.body;

    const type = getDocType(docType);
    if (!type) return res.status(400).json({ message: `Unknown document type: ${docType}` });

    const missing = type.requiredFields.filter((f) => !fields[f]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required field(s): ${missing.join(', ')}` });
    }

    const document = await GeneratedDocument.create({
      docType,
      fields,
      clientId: clientId || undefined,
      createdBy: req.user.userId,
    });

    await logActivity({
      userId: req.user.userId,
      actionType: 'DOCUMENT_GENERATED',
      description: `Saved ${type.label} for ${fields.recipientName || 'unknown recipient'}`,
      clientId: clientId || undefined,
      metadata: { docType },
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const existing = await GeneratedDocument.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Document not found' });

    const type = getDocType(existing.docType);
    const { clientId, ...fields } = req.body;

    const missing = type.requiredFields.filter((f) => !fields[f]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required field(s): ${missing.join(', ')}` });
    }

    existing.fields = fields;
    if (clientId !== undefined) existing.clientId = clientId || undefined;
    existing.updatedBy = req.user.userId;
    await existing.save();

    await logActivity({
      userId: req.user.userId,
      actionType: 'DOCUMENT_GENERATED',
      description: `Updated ${type.label} for ${fields.recipientName || 'unknown recipient'}`,
      clientId: clientId || undefined,
      metadata: { docType: existing.docType },
    });

    res.json(existing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await GeneratedDocument.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const document = await GeneratedDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const type = getDocType(document.docType);
    if (!type) return res.status(400).json({ message: `Unknown document type: ${document.docType}` });

    const settings = await getCompanySettings();
    const docDefinition = type.build({
      orgWebsite: settings.orgWebsite || undefined,
      contactAddress: settings.contactAddress || undefined,
      contactEmail: settings.contactEmail || undefined,
      contactWhatsapp: settings.contactWhatsapp || undefined,
      ...document.fields,
      logoDataUri: settings.logoDataUri,
    });
    const pdfBuffer = await renderPdfBuffer(docDefinition);

    const filenameBase = (document.fields.recipientName || document.docType).replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filenameBase}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
