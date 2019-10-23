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
    "metalsmith-dart-sass": "./metalsmith-sass-options.js"
  }
}
```

**`metalsmith-sass-options.js`**
```js
module.exports = {
  sassOptions: {
    sourceMap: true
  }
};
```

If you want to use the `files` variable or the default options value, you can specify the callback function that generates the options in script file.

**`metalsmith.json`**
```json
{
  "plugins": {
    "metalsmith-dart-sass": "./metalsmith-sass-options.js"
  }
}
```

**`metalsmith-sass-options.js`**
```js
module.exports = (files, metalsmith, defaultOptions) => {
  return {
    pattern: [...defaultOptions.pattern, '!**/_*/**'],
  };
};
```

See [Metalsmith CLI] for more details.

[Metalsmith CLI]: https://github.com/segmentio/metalsmith#cli

## Javascript Usage

The simplest use is to omit the option.

```js
const sass = require('metalsmith-dart-sass');

metalsmith
  .use(sass());
```

If you need to specify an options, set the options value.

```js
const sass = require('metalsmith-dart-sass');

metalsmith
  .use(sass({
    sassOptions: {
      sourceMap: true
    }
  }));
```

If you want to use the `files` variable or the default options value, you can specify the callback function that generates the options.

```js
const sass = require('metalsmith-dart-sass');

metalsmith
  .use(sass(
    (files, metalsmith, defaultOptions) => {
      return {
        pattern: [...defaultOptions.pattern, '!**/_*/**'],
      };
    }
  ));
```

## TypeScript Usage

For compatibility with the [Metalsmith CLI], this package exports single function in CommonJS style.  
When using with TypeScript, it is better to use the [`import = require()` statement](https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require).

```js
import sass = require('metalsmith-dart-sass');

metalsmith
  .use(sass());
```

## Options

The default value for options are [defined](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L92-L105) like this:

```js
const path = require('path');

{
  /**
   * Partial files whose names begin with an underscore should be excluded from conversion.
   * @see https://sass-lang.com/guide#topic-4
   */
  pattern: ['**/*.sass', '**/*.scss', '!**/_*'],
  sassOptions: {},
  renamer(filename) {
    const newFilename = path.basename(filename, path.extname(filename)) + '.css';
    return path.join(path.dirname(filename), newFilename);
  },
  dependenciesKey: false,
}
```

### `pattern`

Only files that match this pattern will be processed.
Specify a glob expression string or an array of glob expression strings as the pattern.

Pattern are verified using [multimatch v4.0.0][npm-multimatch-used].

[npm-multimatch-used]: https://www.npmjs.com/package/multimatch/v/4.0.0

Default value ([source](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L97)):

```js
['**/*.sass', '**/*.scss', '!**/_*']
```

Type definition ([source line 36](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L36) / [source line 82](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L82)):

```ts
string | string[]
```

### `sassOptions`

Specify [Dart Sass] options.
There are three ways to specify options:

* [Plain objects with SASS options defined](#plain-object-of-sass-options)
* [Functions that return SASS options](#functions-that-return-sass-options)
* [Filepath string of the script that exports objects and functions](#filepath-string)

Default value ([source](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L98)):

```js
{}
```

Type definition ([source line 37 - 47](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L37-L47) / [source line 83 - 86](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L83-L86)):

```ts
import Metalsmith from 'metalsmith'; // @types/metalsmith@2.3.0
import sass from 'sass'; // @types/sass@1.16.0

type InputSassImporter =
    | string
    | Record<string, unknown>
    | sass.Importer;

type InputSassFunctionsValue =
    | string
    | Record<string, unknown>
    | Required<sass.Options>['functions'][string];

interface InputSassOptionsInterface
    extends Omit<
        sass.Options,
        'indentedSyntax' | 'sourceMap' | 'importer' | 'functions'
    > {
    indentedSyntax?: string | string[];
    sourceMap?: Exclude<
        Required<sass.Options>['sourceMap'],
        string
    >;
    importer?: InputSassImporter | InputSassImporter[];
    functions?: Record<string, InputSassFunctionsValue>;
}

type SassOptionsFunction = (context: {
    filename: string;
    filedata: object;
    sourceFileFullpath: string;
    destinationFileFullpath: string;
    metalsmith: Metalsmith;
    metalsmithFiles: Metalsmith.Files;
    pluginOptions: object;
}) => sass.Options | Promise<sass.Options>;

string | InputSassOptionsInterface | SassOptionsFunction;
```

#### plain object of SASS options

TODO

Type definition ([source line 24 - 33](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L24-L33) / [source line 60 - 78](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L60-L78)):

```ts
import sass from 'sass'; // @types/sass@1.16.0

type InputSassImporter =
    | string
    | Record<string, unknown>
    | sass.Importer;

type InputSassFunctionsValue =
    | string
    | Record<string, unknown>
    | Required<sass.Options>['functions'][string];

interface InputSassOptionsInterface
    extends Omit<
        sass.Options,
        'indentedSyntax' | 'sourceMap' | 'importer' | 'functions'
    > {
    indentedSyntax?: string | string[];
    sourceMap?: Exclude<
        Required<sass.Options>['sourceMap'],
        string
    >;
    importer?: InputSassImporter | InputSassImporter[];
    functions?: Record<string, InputSassFunctionsValue>;
}

InputSassOptionsInterface
```

#### functions that return SASS options

TODO

Type definition ([source](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L39-L47)):

```ts
import Metalsmith from 'metalsmith'; // @types/metalsmith@2.3.0
import sass from 'sass'; // @types/sass@1.16.0

(context: {
    filename: string;
    filedata: object;
    sourceFileFullpath: string;
    destinationFileFullpath: string;
    metalsmith: Metalsmith;
    metalsmithFiles: Metalsmith.Files;
    pluginOptions: object;
}) => sass.Options | Promise<sass.Options>
```

#### filepath string

TODO

### `renamer`

Specify a function to rename of processed SASS and SCSS files.
By default, a function that replaces file extension with `.css` is setted.

If you specify a [falsy value] other than `undefined`, such as `null` or `false`, processed files will not be renamed.

[falsy value]: https://developer.mozilla.org/en-US/docs/Glossary/Falsy

```js
// These values disable file renaming
false
0
-0
NaN
''
""
``
null
```

If `undefined` or a [truthy value] other than string and function is specified, use the default renamer.

[truthy value]: https://developer.mozilla.org/en-US/docs/Glossary/Truthy

```js
// These values use the default renamer
undefined
true
42
-42
Infinity
-Infinity
{}
[]
/ab+c/i
new Date()
... // And other non-function objects
```

You can also specify the filepath of the script that exports the above values.

```js
const sass = require('metalsmith-dart-sass');

metalsmith
  .use(sass({
    renamer: './sass-renamer.js'
  }));
```

**`sass-renamer.js`**
```js
module.exports = filename => {
  return `${filename}.css`;
};
```

Default value ([source](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L99-L103)):

```js
const path = require('path');

filename => {
  const newFilename = path.basename(filename, path.extname(filename)) + '.css';
  return path.join(path.dirname(filename), newFilename);
}
```

Type definition ([source line 48](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L48) / [source line 87](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L87)):

```ts
string | boolean | null | (filename: string) => (string | Promise<string>)
```

### `dependenciesKey`

**To understand the description of this option, knowledge of [the Metalsmith plugin][Metalsmith plugin] is required.**

[Metalsmith plugin]: https://metalsmith.io/#writing-a-plugin

Specify the property name.
The property specified by this option contains an object with the name and metadata of the before conversion files used in the SASS and SCSS conversion.

For example, if you convert the following files:

**`main.scss`**
```scss
@use 'foo';

body {
  background: black;
}
```

**`_foo.scss`**
```scss
.foo {
  font-weight: bold;
}
```

If value `'dependencies data'` is specified in `dependenciesKey` option, the following "dependencies object" are inserted into the Metalsmith metadata:

```js
// This object is the value that subsequent Metalsmith plugins read from the "files" argument
// see: https://github.com/segmentio/metalsmith#useplugin
{
  'main.css': {
    // ↓ Properties automatically added by Metalsmith
    contents: Buffer.from('.foo {\n  font-weight: bold;\n}\n\nbody {\n  background: black;\n}'), // Converted CSS contents
    mode: ...,
    stats: Stats { ... },
    // ↑ Properties automatically added by Metalsmith

    // ↓ dependencies object added by specifying "dependenciesKey" option
    'dependencies data': {
      // ↓ Metadata of main.scss before conversion
      'main.scss': {
        contents: Buffer.from('@use \'foo\';\n\nbody {\n  background: black;\n}\n'),
        mode: ...,
        stats: Stats { ... },
        ...
      },

      // ↓ Metadata of _foo.scss before conversion
      '_foo.scss': {
        contents: Buffer.from('.foo {\n  font-weight: bold;\n}\n'),
        mode: ...,
        stats: Stats { ... },
        ...
      }
    }
  },
  ...
}
```

If an empty string or a non-string value is specified in the `dependenciesKey` option, the dependencies object is not insert.

```js
// These values not insert dependencies object
false
true
null
undefined
''
""
``
```

Default value ([source](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L104)):

```js
false
```

Type definition ([source](https://github.com/sounisi5011/metalsmith-dart-sass/blob/v1.0.0/src/options/index.ts#L49)):

```ts
string | false | null
```

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
