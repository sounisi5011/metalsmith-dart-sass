import test from 'ava';
import Metalsmith from 'metalsmith';

import sass from '../src';
import fixtures from './fixtures';
import { switchTest } from './helpers';
import { processAsync } from './helpers/metalsmith';

test('should compile SASS and SCSS files to compressed CSS files with callback sassOptions', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                sassOptions() {
                    return { outputStyle: 'compressed' } as {
                        outputStyle: 'compressed';
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
        files['bar.css'],
        'should generate bar.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    );

    const expectedCssText = 'body{font:100% Helvetica,sans-serif;color:#333}';
    t.is(files['foo.css'].contents.toString(), expectedCssText);
    t.is(files['bar.css'].contents.toString(), expectedCssText);
});

test('should generate Source Map files with async callback sassOptions', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                async sassOptions() {
                    return { sourceMap: true };
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
});
