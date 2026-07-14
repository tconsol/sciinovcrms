const path = require('path');
const pdfMake = require('pdfmake');
const CompanySettings = require('../../models/CompanySettings');

const FONTS_DIR = path.join(__dirname, 'fonts');

const fontDescriptors = {
  Roboto: {
    normal: path.join(FONTS_DIR, 'Roboto-Regular.ttf'),
    bold: path.join(FONTS_DIR, 'Roboto-Medium.ttf'),
    italics: path.join(FONTS_DIR, 'Roboto-Italic.ttf'),
    bolditalics: path.join(FONTS_DIR, 'Roboto-MediumItalic.ttf'),
  },
};

const HIGHLIGHT_COLOR = '#FFEB3B';
const LINK_COLOR = '#1155CC';
const TEXT_COLOR = '#1A1A1A';

// Disables fontkit's default 'fi'/'fl'-style ligature substitution (liga/clig/calt are "on" by
// default regardless of any features *array* passed in — only the object form removes them, per
// fontkit's ShapingPlan.setFeatureOverrides). Left at pdfmake's default (null/[]), words like
// "field"/"influencing" still *render* correctly but their ligature glyphs aren't in the
// ToUnicode map, so copy-paste/search extracts "feld"/"infuencing".
const DEFAULT_STYLE = { font: 'Roboto', fontSize: 10.5, color: TEXT_COLOR, fontFeatures: { liga: false, clig: false, calt: false } };

// pdfmake's Node entry point is a shared singleton, not a class you construct yourself.
// Local file access also gates font loading, so the policy must allow our vendored fonts
// directory; templates never reference remote URLs or other local paths, so those stay denied.
pdfMake.setFonts(fontDescriptors);
pdfMake.setUrlAccessPolicy(() => false);
pdfMake.setLocalAccessPolicy((filePath) => path.resolve(filePath).startsWith(FONTS_DIR));

async function renderPdfBuffer(docDefinition) {
  const doc = pdfMake.createPdf(docDefinition);
  return doc.getBuffer();
}

// Always reads fresh from the DB (no caching) so a logo/settings change is reflected
// on the very next render. Returns { logoDataUri, orgName, orgWebsite, contactAddress,
// contactEmail, contactWhatsapp } — text fields are author-time defaults; a saved
// document's own field values (if present) should win over these.
async function getCompanySettings() {
  const settings = await CompanySettings.findOne();
  const logoDataUri = settings?.logo?.data
    ? `data:${settings.logo.contentType};base64,${settings.logo.data.toString('base64')}`
    : null;
  return {
    logoDataUri,
    orgName: settings?.orgName || '',
    orgWebsite: settings?.orgWebsite || '',
    contactAddress: settings?.contactAddress || '',
    contactEmail: settings?.contactEmail || '',
    contactWhatsapp: settings?.contactWhatsapp || '',
  };
}

function highlightRun(text, extra = {}) {
  return { text, background: HIGHLIGHT_COLOR, bold: true, ...extra };
}

function linkRun(text, url, extra = {}) {
  return { text, link: url, color: LINK_COLOR, decoration: 'underline', ...extra };
}

function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function formatLongDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
}

// Shared logo row: reserves the top-right corner via a column so following content
// never overlaps it, regardless of whether a logo has been uploaded yet.
function logoHeaderRow(logoDataUri) {
  return {
    columns: [
      { width: '*', text: '' },
      logoDataUri
        ? { width: 110, image: 'logo', fit: [90, 55], alignment: 'right' }
        : { width: 110, text: '' },
    ],
    margin: [0, 0, 0, 10],
  };
}

module.exports = {
  renderPdfBuffer,
  getCompanySettings,
  highlightRun,
  linkRun,
  formatLongDate,
  logoHeaderRow,
  HIGHLIGHT_COLOR,
  LINK_COLOR,
  TEXT_COLOR,
  DEFAULT_STYLE,
};
