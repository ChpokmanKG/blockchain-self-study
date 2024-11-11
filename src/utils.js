const crypto = require('crypto');

const generateHash = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
}

module.exports = {generateHash};
