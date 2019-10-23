# metalsmith-dart-sass

[![Go to the latest release page on npm](https://img.shields.io/npm/v/metalsmith-dart-sass.svg)](https://www.npmjs.com/package/metalsmith-dart-sass)
[![License: MIT](https://img.shields.io/static/v1?label=license&message=MIT&color=green)][github-license]
![Supported Node.js version: >=8.3.0](https://img.shields.io/static/v1?label=node&message=%3E%3D8.3.0&color=brightgreen)
![Type Definitions: TypeScript](https://img.shields.io/static/v1?label=types&message=TypeScript&color=blue)
[![bundle size](https://badgen.net/bundlephobia/min/metalsmith-dart-sass@1.0.0)](https://bundlephobia.com/result?p=metalsmith-dart-sass@1.0.0)
[![Dependencies Status](https://david-dm.org/sounisi5011/metalsmith-dart-sass/status.svg)](https://david-dm.org/sounisi5011/metalsmith-dart-sass)
[![Build Status](https://travis-ci.com/sounisi5011/metalsmith-dart-sass.svg?branch=master)](https://travis-ci.com/sounisi5011/metalsmith-dart-sass)
[![Maintainability Status](https://api.codeclimate.com/v1/badges/6b88d91863e46e9c12fd/maintainability)](https://codeclimate.com/github/sounisi5011/metalsmith-dart-sass/maintainability)

[github-license]: https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/LICENSE

[Dart Sass] plugin for [Metalsmith].

[Dart Sass]: https://sass-lang.com/dart-sass
[Metalsmith]: https://github.com/segmentio/metalsmith

## Install

```sh
npm install metalsmith-dart-sass
```

## CLI Usage

The simplest use is with a PostCSS configuration file.

### Use PostCSS configuration file

Install via npm and then add the `metalsmith-dart-sass` key to your `metalsmith.json` plugin, like so:

**`metalsmith.json`**
```json
{
  "plugins": {
    "metalsmith-dart-sass": true
  }
}
```

If you need to specify an options, set the options to the value of the `metalsmith-dart-sass` key.

**`metalsmith.json`**
```json
{
  "plugins": {
    "metalsmith-dart-sass": {
      "sassOptions": {
        "sourceMap": true
      }
    }
  }
}
```

Or, set the filepath of the script file that exports options to the value of the `metalsmith-dart-sass` key.

**`metalsmith.json`**
```json
{
  "plugins": {
    "metalsmith-dart-sass": "./options.js"
  }
}
```

**`options.js`**
```js
module.exports = {
  sassOptions: {
    sourceMap: true
  }
};
```

See [Metalsmith CLI] for more details.

[Metalsmith CLI]: https://github.com/segmentio/metalsmith#cli

## Javascript Usage

TODO

## Debug mode

This plugin supports debugging output.  
To enable, use the following command when running your build script:

```sh
DEBUG=metalsmith-dart-sass node my-website-build.js
```

For more details, please check the description of [debug v4.1.1][npm-debug-used].

[npm-debug-used]: https://www.npmjs.com/package/debug/v/4.1.1

## Tests

To run the test suite, first install the dependencies, then run `npm test`:

```sh
npm install
npm test
```

## Contributing

see [CONTRIBUTING.md](https://github.com/sounisi5011/metalsmith-dart-sass/blob/master/CONTRIBUTING.md)
