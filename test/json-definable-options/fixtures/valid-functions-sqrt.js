const sass = require('sass');

module.exports = (number, done) => {
  if (!(number instanceof sass.types.Number)) {
    throw '$number: Expected a number.';
  } else if (number.getUnit()) {
    throw '$number: Expected a unitless number.';
  }

  done(new sass.types.Number(Math.sqrt(number.getValue())));
};
