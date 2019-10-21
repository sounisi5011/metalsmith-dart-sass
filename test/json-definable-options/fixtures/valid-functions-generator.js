const sass = require('sass');

const retNull = arg => {
  return sass.types.Null;
};

module.exports = opts => retNull;
