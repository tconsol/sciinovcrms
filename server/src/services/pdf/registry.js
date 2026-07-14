const { buildAcceptanceLetterDefinition } = require('./templates/acceptanceLetter');

// Add a new document type by adding one entry here (plus its template file) —
// the CRUD routes, list-types endpoint, and required-field validation all read
// from this registry, nothing else needs to change.
const REGISTRY = {
  ACCEPTANCE_LETTER: {
    label: 'Letter of Acceptance',
    build: buildAcceptanceLetterDefinition,
    requiredFields: [
      'recipientName',
      'conferenceName',
      'conferenceDates',
      'conferenceLocation',
      'eventTagline',
      'shortCode',
      'paperTitle',
      'presentationType',
      'signatoryName',
    ],
  },
};

function getDocType(docType) {
  return REGISTRY[docType];
}

function listDocTypes() {
  return Object.entries(REGISTRY).map(([docType, { label, requiredFields }]) => ({ docType, label, requiredFields }));
}

module.exports = { getDocType, listDocTypes };
