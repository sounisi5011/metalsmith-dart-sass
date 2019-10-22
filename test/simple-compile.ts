import test from 'ava';
import Metalsmith from 'metalsmith';

import sass from '../src';
import fixtures from './fixtures';
import { hasProp, switchTest } from './helpers';
import { processAsync } from './helpers/metalsmith';

test('should compile SASS and SCSS files', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(sass());
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
        !hasProp(files, 'foo.sass'),
        'should remove foo.sass file',
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
        !hasProp(files, 'bar.scss'),
        'should remove bar.scss file',
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
    t.is(files['foo.css'].contents.toString(), expectedCssText);
    t.is(files['bar.css'].contents.toString(), expectedCssText);
});
