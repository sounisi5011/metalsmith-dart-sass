import test from 'ava';
import Metalsmith from 'metalsmith';
import util from 'util';

import sass from '../src';
import fixtures from './fixtures';
import { processAsync } from './helpers/metalsmith';
import { isValidSourceMap } from './helpers/source-map';

for (const renamer of [
    undefined,
    true,
    1,
    -1,
    42,
    -42,
    Infinity,
    -Infinity,
    {},
    [],
    /ab+c/i,
    new RegExp(''),
    new Date(),
    new Date(0),
    Buffer.from([0x01]),
    Buffer.from([0x00]),
    Buffer.from([]),
]) {
    test(
        'should generate Source Map files: set renamer option to ' +
            util.inspect(renamer),
        async t => {
            const metalsmith = Metalsmith(fixtures('simple'))
                .source('src')
                .use(
                    sass({
                        sassOptions: { sourceMap: true },
                        renamer:
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            renamer as any,
                    }),
                );
            const files = await processAsync(metalsmith);

            t.deepEqual(
                Object.keys(files).sort(),
                ['foo.css', 'foo.css.map', 'bar.css', 'bar.css.map'].sort(),
                'should generate CSS and Source Map files',
            );

            const expectedCssText =
                'body {\n  font: 100% Helvetica, sans-serif;\n  color: #333;\n}';
            t.is(
                files['foo.css'].contents.toString(),
                expectedCssText + '\n\n/*# sourceMappingURL=foo.css.map */',
            );
            t.is(
                files['bar.css'].contents.toString(),
                expectedCssText + '\n\n/*# sourceMappingURL=bar.css.map */',
            );

            let fooSourceMap: unknown = null;
            t.notThrows(() => {
                fooSourceMap = JSON.parse(
                    files['foo.css.map'].contents.toString(),
                );
            }, 'should parse foo.css.map file');
            if (!isValidSourceMap(fooSourceMap)) {
                t.fail('should valid SourceMap file');
                t.log(fooSourceMap);
                return;
            }
            t.is(
                fooSourceMap.file,
                'foo.css',
                '"file" property should indicate renamed CSS file location',
            );
            t.falsy(
                fooSourceMap.sourceRoot,
                '"sourceRoot" property should be undefined or empty string',
            );
            t.deepEqual(
                fooSourceMap.sources,
                ['../src/foo.sass'],
                'should include original SASS file URL in "sources" property',
            );

            let barSourceMap: unknown = null;
            t.notThrows(() => {
                barSourceMap = JSON.parse(
                    files['bar.css.map'].contents.toString(),
                );
            }, 'should parse bar.css.map file');
            if (!isValidSourceMap(barSourceMap)) {
                t.fail('should valid SourceMap file');
                t.log(barSourceMap);
                return;
            }
            t.is(
                barSourceMap.file,
                'bar.css',
                '"file" property should indicate renamed CSS file location',
            );
            t.falsy(
                barSourceMap.sourceRoot,
                '"sourceRoot" property should be undefined or empty string',
            );
            t.deepEqual(
                barSourceMap.sources,
                ['../src/bar.scss'],
                'should include original SASS file URL in "sources" property',
            );
        },
    );
}

for (const renamer of [false, 0, -0, NaN, '', null]) {
    test(
        'should generate Source Map files: set renamer option to ' +
            util.inspect(renamer),
        async t => {
            const metalsmith = Metalsmith(fixtures('simple'))
                .source('src')
                .use(
                    sass({
                        sassOptions: { sourceMap: true },
                        renamer:
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            renamer as any,
                    }),
                );
            const files = await processAsync(metalsmith);

            t.deepEqual(
                Object.keys(files).sort(),
                ['foo.sass', 'foo.sass.map', 'bar.scss', 'bar.scss.map'].sort(),
                'should generate non renamed CSS and Source Map files',
            );

            const expectedCssText =
                'body {\n  font: 100% Helvetica, sans-serif;\n  color: #333;\n}';
            t.is(
                files['foo.sass'].contents.toString(),
                expectedCssText + '\n\n/*# sourceMappingURL=foo.sass.map */',
            );
            t.is(
                files['bar.scss'].contents.toString(),
                expectedCssText + '\n\n/*# sourceMappingURL=bar.scss.map */',
            );

            let fooSourceMap: unknown = null;
            t.notThrows(() => {
                fooSourceMap = JSON.parse(
                    files['foo.sass.map'].contents.toString(),
                );
            }, 'should parse foo.sass.map file');
            if (!isValidSourceMap(fooSourceMap)) {
                t.fail('should valid SourceMap file');
                t.log(fooSourceMap);
                return;
            }
            t.is(
                fooSourceMap.file,
                'foo.sass',
                '"file" property should indicate non renamed CSS file location',
            );
            t.falsy(
                fooSourceMap.sourceRoot,
                '"sourceRoot" property should be undefined or empty string',
            );
            t.deepEqual(
                fooSourceMap.sources,
                ['../src/foo.sass'],
                'should include original SASS file URL in "sources" property',
            );

            let barSourceMap: unknown = null;
            t.notThrows(() => {
                barSourceMap = JSON.parse(
                    files['bar.scss.map'].contents.toString(),
                );
            }, 'should parse bar.scss.map file');
            if (!isValidSourceMap(barSourceMap)) {
                t.fail('should valid SourceMap file');
                t.log(barSourceMap);
                return;
            }
            t.is(
                barSourceMap.file,
                'bar.scss',
                '"file" property should indicate non renamed CSS file location',
            );
            t.falsy(
                barSourceMap.sourceRoot,
                '"sourceRoot" property should be undefined or empty string',
            );
            t.deepEqual(
                barSourceMap.sources,
                ['../src/bar.scss'],
                'should include original SASS file URL in "sources" property',
            );
        },
    );
}

test('should generate Source Map files with custom renamer', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                sassOptions: { sourceMap: true },
                renamer(filename) {
                    return `${filename}-css`;
                },
            }),
        );
    const files = await processAsync(metalsmith);

    t.deepEqual(
        Object.keys(files).sort(),
        [
            'foo.sass-css',
            'foo.sass-css.map',
            'bar.scss-css',
            'bar.scss-css.map',
        ].sort(),
        'should generate renamed CSS and Source Map files',
    );

    const expectedCssText =
        'body {\n  font: 100% Helvetica, sans-serif;\n  color: #333;\n}';
    t.is(
        files['foo.sass-css'].contents.toString(),
        expectedCssText + '\n\n/*# sourceMappingURL=foo.sass-css.map */',
    );
    t.is(
        files['bar.scss-css'].contents.toString(),
        expectedCssText + '\n\n/*# sourceMappingURL=bar.scss-css.map */',
    );

    let fooSourceMap: unknown = null;
    t.notThrows(() => {
        fooSourceMap = JSON.parse(
            files['foo.sass-css.map'].contents.toString(),
        );
    }, 'should parse foo.sass-css.map file');
    if (!isValidSourceMap(fooSourceMap)) {
        t.fail('should valid SourceMap file');
        t.log(fooSourceMap);
        return;
    }
    t.is(
        fooSourceMap.file,
        'foo.sass-css',
        '"file" property should indicate renamed CSS file location',
    );
    t.falsy(
        fooSourceMap.sourceRoot,
        '"sourceRoot" property should be undefined or empty string',
    );
    t.deepEqual(
        fooSourceMap.sources,
        ['../src/foo.sass'],
        'should include original SASS file URL in "sources" property',
    );

    let barSourceMap: unknown = null;
    t.notThrows(() => {
        barSourceMap = JSON.parse(
            files['bar.scss-css.map'].contents.toString(),
        );
    }, 'should parse bar.scss-css.map file');
    if (!isValidSourceMap(barSourceMap)) {
        t.fail('should valid SourceMap file');
        t.log(barSourceMap);
        return;
    }
    t.is(
        barSourceMap.file,
        'bar.scss-css',
        '"file" property should indicate renamed CSS file location',
    );
    t.falsy(
        barSourceMap.sourceRoot,
        '"sourceRoot" property should be undefined or empty string',
    );
    t.deepEqual(
        barSourceMap.sources,
        ['../src/bar.scss'],
        'should include original SASS file URL in "sources" property',
    );
});
