import test from 'ava';
import Metalsmith from 'metalsmith';

import sass from '../src';
import fixtures from './fixtures';
import { switchTest } from './helpers';
import { processAsync } from './helpers/metalsmith';
import { isValidSourceMap } from './helpers/source-map';

test('should generate Source Map files', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(sass({ options: { sourceMap: true } }));
    const files = await processAsync(metalsmith);

    switchTest(
        files['foo.css'],
        'should generate foo.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        files['foo.css.map'],
        'should generate foo.css.map file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        files['bar.css'],
        'should generate bar.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        files['bar.css.map'],
        'should generate bar.css.map file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
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
        fooSourceMap = JSON.parse(files['foo.css.map'].contents.toString());
    }, 'should parse foo.css.map file');
    if (!isValidSourceMap(fooSourceMap)) {
        t.fail('should valid SourceMap file');
        t.log(fooSourceMap);
        return;
    }
    t.is(
        fooSourceMap.file,
        'foo.css',
        '"file" property should indicate the CSS file location',
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
        barSourceMap = JSON.parse(files['bar.css.map'].contents.toString());
    }, 'should parse bar.css.map file');
    if (!isValidSourceMap(barSourceMap)) {
        t.fail('should valid SourceMap file');
        t.log(barSourceMap);
        return;
    }
    t.is(
        barSourceMap.file,
        'bar.css',
        '"file" property should indicate the CSS file location',
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

test('should generate Source Map files with modules', async t => {
    const metalsmith = Metalsmith(fixtures('modules'))
        .source('src')
        .use(sass({ options: { sourceMap: true } }));
    const files = await processAsync(metalsmith);

    switchTest(
        files['styles.css'],
        'should generate styles.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        files['styles.css.map'],
        'should generate styles.css.map file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    );

    const expectedCssText =
        'body {\n  font: 100% Helvetica, sans-serif;\n  color: #333;\n}\n\n.inverse {\n  background-color: #333;\n  color: white;\n}';
    t.is(
        files['styles.css'].contents.toString(),
        expectedCssText + '\n\n/*# sourceMappingURL=styles.css.map */',
    );

    let sourceMap: unknown = null;
    t.notThrows(() => {
        sourceMap = JSON.parse(files['styles.css.map'].contents.toString());
    }, 'should parse styles.css.map file');
    if (!isValidSourceMap(sourceMap)) {
        t.fail('should valid SourceMap file');
        t.log(sourceMap);
        return;
    }
    t.is(
        sourceMap.file,
        'styles.css',
        '"file" property should indicate the CSS file location',
    );
    t.falsy(
        sourceMap.sourceRoot,
        '"sourceRoot" property should be undefined or empty string',
    );
    t.deepEqual(
        sourceMap.sources.sort(),
        ['../src/styles.sass', '../src/_base.sass'].sort(),
        'should include original SASS files URL in "sources" property',
    );
});
