const { highlightRun, linkRun, formatLongDate, logoHeaderRow, DEFAULT_STYLE } = require('../letterhead');

function buildAcceptanceLetterDefinition({
  logoDataUri,
  letterDate,
  conferenceName,
  conferenceDates,
  conferenceLocation,
  shortCode,
  eventTagline,
  websiteUrl,
  recipientName,
  affiliation,
  country,
  paperTitle,
  presentationType,
  signatoryName,
  signatoryTitle,
  contactAddress,
  contactEmail,
  contactWhatsapp,
  orgWebsite = 'https://www.sciinovgroup.com/',
}) {
  const location = conferenceLocation.endsWith('.') ? conferenceLocation : `${conferenceLocation}.`;

  const content = [
    logoHeaderRow(logoDataUri),

    { text: conferenceName, bold: true, fontSize: 16, background: '#FFEB3B', margin: [0, 0, 0, 2] },
    { text: `${conferenceDates} | ${conferenceLocation}`, bold: true, fontSize: 11, background: '#FFEB3B', margin: [0, 0, 0, 14] },

    { text: formatLongDate(letterDate), bold: true, alignment: 'right', margin: [0, 0, 0, 14] },

    { text: '(Letter of Acceptance)', bold: true, fontSize: 13, alignment: 'center', margin: [0, 0, 0, 16] },

    { text: ['To ', highlightRun(`${recipientName},`)], margin: [0, 0, 0, 2] },
  ];

  if (affiliation) content.push({ text: highlightRun(`${affiliation},`), margin: [0, 0, 0, 2] });
  if (country) content.push({ text: highlightRun(`${country},`), margin: [0, 4, 0, 14] });

  content.push(
    {
      text: [
        { text: 'Sciinov Group', bold: true },
        ' cordially invites you to attend ',
        highlightRun(conferenceName),
        ' to be held on ',
        highlightRun(conferenceDates),
        ' at ',
        highlightRun(location),
        ` ${eventTagline}`,
      ],
      alignment: 'justify',
      lineHeight: 1.3,
      margin: [0, 0, 0, 14],
    },
    {
      text: [
        'We are glad to inform you that your research titled as “',
        { text: paperTitle, bold: true },
        '” has been accepted for ',
        highlightRun(presentationType),
        ' at our conference. We are happy to have your presentation at our conference.',
      ],
      alignment: 'justify',
      lineHeight: 1.3,
      margin: [0, 0, 0, 14],
    },
    {
      text: ['For more details, please visit our website: ', linkRun(websiteUrl, websiteUrl)],
      margin: [0, 0, 0, 14],
    },
    {
      text: ['We look forward for your session at ', highlightRun(shortCode), ' conference.'],
      margin: [0, 0, 0, 28],
    },
    { text: 'Regards,', margin: [0, 0, 0, 32] },
    { text: signatoryName, bold: true, margin: [0, 0, 0, 1] },
    { text: [`${signatoryTitle}| `, highlightRun(shortCode)], margin: [0, 0, 0, 6] },
  );

  if (contactAddress) content.push({ text: contactAddress, fontSize: 9, margin: [0, 0, 0, 1] });
  if (contactEmail) content.push({ text: ['Email: ', linkRun(contactEmail, `mailto:${contactEmail}`, { fontSize: 9 })], fontSize: 9, margin: [0, 0, 0, 1] });
  if (contactWhatsapp) content.push({ text: `WhatsApp: ${contactWhatsapp}`, fontSize: 9, margin: [0, 0, 0, 14] });

  content.push(
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 0.5, lineColor: '#999999' }], margin: [0, 0, 0, 8] },
    {
      text: ['Disclaimer: This invitation is to attend ', highlightRun(shortCode, { fontSize: 9 }), ' Conference only'],
      italics: true,
      fontSize: 9,
      alignment: 'center',
      margin: [0, 0, 0, 8],
    },
    { text: orgWebsite, link: orgWebsite, bold: true, color: '#1155CC', decoration: 'underline', alignment: 'center' }
  );

  return {
    pageSize: 'A4',
    pageMargins: [50, 50, 50, 50],
    images: logoDataUri ? { logo: logoDataUri } : {},
    defaultStyle: DEFAULT_STYLE,
    content,
  };
}

module.exports = { buildAcceptanceLetterDefinition };
