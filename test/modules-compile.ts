import test from 'ava';
import Metalsmith from 'metalsmith';

import sass from '../src';
import fixtures from './fixtures';
import { hasProp, switchTest } from './helpers';
import { processAsync } from './helpers/metalsmith';

test('should compile SASS files with modules', async t => {
    const metalsmith = Metalsmith(fixtures('modules'))
        .source('src')
        .use(sass());
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
        !hasProp(files, 'styles.sass'),
        'should remove styles.sass file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        !hasProp(files, '_base.css'),
        'should not generate _base.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        !hasProp(files, 'base.css'),
        'should not generate base.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        !hasProp(files, '_base.sass'),
        'should remove _base.sass file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        hasProp(files, '_hoge.sass'),
        'should not remove extraneous SASS file',
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
    t.is(files['styles.css'].contents.toString(), expectedCssText);
});
