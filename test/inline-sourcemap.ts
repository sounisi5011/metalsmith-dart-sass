import test from 'ava';
import escapeStringRegexp from 'escape-string-regexp';
import Metalsmith from 'metalsmith';

import sass from '../src';
import fixtures from './fixtures';
import { processAsync } from './helpers/metalsmith';
import {
    base64ToStr,
    inlineSourceMappingURLCommentRegExp,
    isValidSourceMap,
} from './helpers/source-map';

test('should generate inline Source Map files', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(sass({ sassOptions: { sourceMap: true, sourceMapEmbed: true } }));
    const files = await processAsync(metalsmith);

    t.deepEqual(
        Object.keys(files).sort(),
        ['foo.css', 'bar.css'].sort(),
        'should not generate Source Map files',
    );

    const expectedCssTextRegExp = new RegExp(
        `^${escapeStringRegexp(
            'body {\n  font: 100% Helvetica, sans-serif;\n  color: #333;\n}',
        )}\n\n${inlineSourceMappingURLCommentRegExp.source}`,
    );
    t.regex(files['foo.css'].contents.toString(), expectedCssTextRegExp);
    t.regex(files['bar.css'].contents.toString(), expectedCssTextRegExp);

    let fooSourceMap: unknown = null;
    t.notThrows(() => {
        const sourceMapBase64 = (expectedCssTextRegExp.exec(
            files['foo.css'].contents.toString(),
        ) || ['', ''])[1];
        fooSourceMap = JSON.parse(base64ToStr(sourceMapBase64));
    }, 'should parse inline Source Map in foo.css file');
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
        const sourceMapBase64 = (expectedCssTextRegExp.exec(
            files['bar.css'].contents.toString(),
        ) || ['', ''])[1];
        barSourceMap = JSON.parse(base64ToStr(sourceMapBase64));
    }, 'should parse inline Source Map in bar.css file');
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

test('should generate inline Source Map files with modules', async t => {
    const metalsmith = Metalsmith(fixtures('modules'))
        .source('src')
        .use(sass({ sassOptions: { sourceMap: true, sourceMapEmbed: true } }));
    const files = await processAsync(metalsmith);

    t.deepEqual(
        Object.keys(files),
        ['styles.css'],
        'should not generate Source Map files',
    );

    const expectedCssTextRegExp = new RegExp(
        `^${escapeStringRegexp(
            'body {\n  font: 100% Helvetica, sans-serif;\n  color: #333;\n}\n\n.inverse {\n  background-color: #333;\n  color: white;\n}',
        )}\n\n${inlineSourceMappingURLCommentRegExp.source}`,
    );
    t.regex(files['styles.css'].contents.toString(), expectedCssTextRegExp);

    let sourceMap: unknown = null;
    t.notThrows(() => {
        const sourceMapBase64 = (expectedCssTextRegExp.exec(
            files['styles.css'].contents.toString(),
        ) || ['', ''])[1];
        sourceMap = JSON.parse(base64ToStr(sourceMapBase64));
    }, 'should parse inline Source Map in styles.css file');
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
