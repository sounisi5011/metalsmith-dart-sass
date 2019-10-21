import test from 'ava';
import Metalsmith from 'metalsmith';
import path from 'path';

import sass from '../src';
import fixtures from './fixtures';
import { switchTest } from './helpers';
import { processAsync } from './helpers/metalsmith';
import { isValidSourceMap } from './helpers/source-map';

test('should generate Source Map files in customized path', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                sassOptions({ filename }) {
                    return { sourceMap: `${filename}.x-map` };
                },
            }),
        );
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
        files['foo.sass.x-map'],
        'should generate foo.sass.x-map file',
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
        files['bar.scss.x-map'],
        'should generate bar.scss.x-map file',
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
        expectedCssText + '\n\n/*# sourceMappingURL=foo.sass.x-map */',
    );
    t.is(
        files['bar.css'].contents.toString(),
        expectedCssText + '\n\n/*# sourceMappingURL=bar.scss.x-map */',
    );

    let fooSourceMap: unknown = null;
    t.notThrows(() => {
        fooSourceMap = JSON.parse(files['foo.sass.x-map'].contents.toString());
    }, 'should parse foo.sass.x-map file');
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
        barSourceMap = JSON.parse(files['bar.scss.x-map'].contents.toString());
    }, 'should parse bar.scss.x-map file');
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

test('should generate Source Map files in customized fullpath', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                sassOptions({ destinationFileFullpath }) {
                    return {
                        sourceMap: `${destinationFileFullpath}.source-map`,
                    };
                },
            }),
        );
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
        files['foo.css.source-map'],
        'should generate foo.css.source-map file',
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
        files['bar.css.source-map'],
        'should generate bar.css.source-map file',
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
        expectedCssText + '\n\n/*# sourceMappingURL=foo.css.source-map */',
    );
    t.is(
        files['bar.css'].contents.toString(),
        expectedCssText + '\n\n/*# sourceMappingURL=bar.css.source-map */',
    );

    let fooSourceMap: unknown = null;
    t.notThrows(() => {
        fooSourceMap = JSON.parse(
            files['foo.css.source-map'].contents.toString(),
        );
    }, 'should parse foo.css.source-map file');
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
        barSourceMap = JSON.parse(
            files['bar.css.source-map'].contents.toString(),
        );
    }, 'should parse bar.css.source-map file');
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

test('should fail if the sourceMap option specifies a path that is not in the Metalsmith destination directory / fullpath', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                sassOptions({ sourceFileFullpath }) {
                    return { sourceMap: `${sourceFileFullpath}.s.map` };
                },
            }),
        );

    await t.throwsAsync(
        async () => {
            await processAsync(metalsmith);
        },
        {
            instanceOf: Error,
            message:
                `The filepath of the SASS sourceMap option is invalid.` +
                ` If you specify a string for the sourceMap option, you must specify a path in the Metalsmith destination directory.`,
        },
    );
});

test('should fail if the sourceMap option specifies a path that is not in the Metalsmith destination directory / relative path', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                sassOptions({ destinationFileFullpath }) {
                    return {
                        sourceMap: `../../../../${path.basename(
                            destinationFileFullpath,
                        )}.map`,
                    };
                },
            }),
        );

    await t.throwsAsync(
        async () => {
            await processAsync(metalsmith);
        },
        {
            instanceOf: Error,
            message:
                `The filepath of the SASS sourceMap option is invalid.` +
                ` If you specify a string for the sourceMap option, you must specify a path in the Metalsmith destination directory.`,
        },
    );
});

test('In the sassOptions specified in the object, specifying a string for the sourceMap option should fail', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(sass({ sassOptions: { sourceMap: 'out.map' } }));

    await t.throwsAsync(
        async () => {
            await processAsync(metalsmith);
        },
        {
            instanceOf: TypeError,
            message:
                `String values for SASS sourceMap option are forbidden.` +
                ` The Source Map filepath must be define for each file to be processed.` +
                ` You need to specify a callback function in sassOptions and define the sourceMap option with a different value for each file.`,
        },
    );
});

test('Duplicate string value sourceMap option should fail', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                sassOptions() {
                    return { sourceMap: 'out.map' };
                },
            }),
        );

    await t.throwsAsync(
        async () => {
            await processAsync(metalsmith);
        },
        {
            instanceOf: Error,
            message:
                `Duplicate string value SASS sourceMap option are forbidden.` +
                ` The Source Map filepath must be define for each file to be processed.` +
                ` You need to define the sourceMap option with a different value for each file.`,
        },
    );
});
