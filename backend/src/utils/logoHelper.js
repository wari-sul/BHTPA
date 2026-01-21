const fs = require('fs');
const path = require('path');

/**
 * Get logo as base64 data URI for embedding in PDF
 * @returns {string} Base64 data URI or empty string if logo not found
 */
function getLogoBase64() {
  const logoPath = path.join(__dirname, '../assets/logo.png');
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  }
  return '';
}

module.exports = { getLogoBase64 };
