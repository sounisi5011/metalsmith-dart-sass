const packageImporter = require('node-sass-package-importer');

module.exports = [(url, prev) => null, packageImporter()];
