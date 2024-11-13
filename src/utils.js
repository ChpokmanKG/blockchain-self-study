const crypto = require('crypto');

const generateHash = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Do not repeat at home!
const keys = {
  private: '324af0d6b4a835370d37c3f2aab409259a52624dfe52b2ba9f2d4d92a818ec7c',
  minersPrivate: 'b617594ee01f19cd80832c85c34613293a00444e6dd0352d1dc5b3d3f3c20e80'
};

module.exports = {generateHash, keys};
