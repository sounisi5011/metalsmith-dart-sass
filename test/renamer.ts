import test from 'ava';
import Metalsmith from 'metalsmith';
import util from 'util';

import sass from '../src';
import fixtures from './fixtures';
import { hasProp, switchTest } from './helpers';
import { processAsync } from './helpers/metalsmith';

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
        'should rename SASS and SCSS files to CSS: set renamer option to ' +
            util.inspect(renamer),
        async t => {
            const metalsmith = Metalsmith(fixtures('simple'))
                .source('src')
                .use(
                    sass({
                        renamer:
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            renamer as any,
                    }),
                );
            const files = await processAsync(metalsmith);

            t.deepEqual(
                Object.keys(files).sort(),
                ['foo.css', 'bar.css'].sort(),
                'should generate CSS and Source Map files',
            );

            const expectedCssText =
                'body {\n  font: 100% Helvetica, sans-serif;\n  color: #333;\n}';
            t.is(files['foo.css'].contents.toString(), expectedCssText);
            t.is(files['bar.css'].contents.toString(), expectedCssText);
        },
    );
}

for (const renamer of [false, 0, -0, NaN, '', null]) {
    test(
        'should not rename SASS and SCSS files: set renamer option to ' +
            util.inspect(renamer),
        async t => {
            const metalsmith = Metalsmith(fixtures('simple'))
                .source('src')
                .use(
                    sass({
                        renamer:
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            renamer as any,
                    }),
                );
            const files = await processAsync(metalsmith);

            t.deepEqual(
                Object.keys(files).sort(),
                ['foo.sass', 'bar.scss'].sort(),
                'should generate non renamed CSS and Source Map files',
            );

            const expectedCssText =
                'body {\n  font: 100% Helvetica, sans-serif;\n  color: #333;\n}';
            t.is(files['foo.sass'].contents.toString(), expectedCssText);
            t.is(files['bar.scss'].contents.toString(), expectedCssText);
        },
    );
}

test('should rename SASS and SCSS files with custom renamer', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass({
                renamer(filename) {
                    return `${filename}-css`;
                },
            }),
        );
    const files = await processAsync(metalsmith);

    switchTest(
        files['foo.sass-css'],
        'should generate foo.sass-css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        !hasProp(files, 'foo.css'),
        'should not generate foo.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        !hasProp(files, 'foo.sass'),
        'should not exist foo.sass file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        files['bar.scss-css'],
        'should generate bar.scss-css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        !hasProp(files, 'bar.css'),
        'should not generate bar.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        !hasProp(files, 'bar.scss'),
        'should not exist bar.scss file',
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
    t.is(files['foo.sass-css'].contents.toString(), expectedCssText);
    t.is(files['bar.scss-css'].contents.toString(), expectedCssText);
});
