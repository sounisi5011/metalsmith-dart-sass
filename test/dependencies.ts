import test from 'ava';
import Metalsmith from 'metalsmith';

import sass from '../src';
import fixtures from './fixtures';
import { switchTest } from './helpers';
import { debuggerPlugin, processAsync } from './helpers/metalsmith';

test('should export dependencies files', async t => {
    const dependenciesKey = 'deps';
    let beforeFiles: Metalsmith.Files = {};
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(debuggerPlugin(files => (beforeFiles = { ...files })))
        .use(sass({ dependenciesKey }));
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
        files['foo.css'][dependenciesKey],
        `should have "${dependenciesKey}" property in foo.css file metadata`,
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files['foo.css']);
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
        files['bar.css'][dependenciesKey],
        `should have "${dependenciesKey}" property in bar.css file metadata`,
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files['bar.css']);
        },
    );

    t.deepEqual(Object.keys(files['foo.css'][dependenciesKey]), ['foo.sass']);
    t.is(
        files['foo.css'][dependenciesKey]['foo.sass'],
        beforeFiles['foo.sass'],
    );

    t.deepEqual(Object.keys(files['bar.css'][dependenciesKey]), ['bar.scss']);
    t.is(
        files['bar.css'][dependenciesKey]['bar.scss'],
        beforeFiles['bar.scss'],
    );
});

test('should export dependencies files with modules', async t => {
    const dependenciesKey = 'depends';
    let beforeFiles: Metalsmith.Files = {};
    const metalsmith = Metalsmith(fixtures('modules'))
        .source('src')
        .use(debuggerPlugin(files => (beforeFiles = { ...files })))
        .use(sass({ dependenciesKey }));
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
        files['styles.css'][dependenciesKey],
        `should have "${dependenciesKey}" property in styles.css file metadata`,
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files['styles.css']);
        },
    );

    t.deepEqual(Object.keys(files['styles.css'][dependenciesKey]), [
        'styles.sass',
        '_base.sass',
    ]);
    t.is(
        files['styles.css'][dependenciesKey]['styles.sass'],
        beforeFiles['styles.sass'],
    );
    t.is(
        files['styles.css'][dependenciesKey]['_base.sass'],
        beforeFiles['_base.sass'],
    );
});

test('should export dependencies files with node modules include', async t => {
    const dependenciesKey = 'dependencies';
    let beforeFiles: Metalsmith.Files = {};
    const metalsmith = Metalsmith(fixtures('include-node-modules'))
        .source('src')
        .use(debuggerPlugin(files => (beforeFiles = { ...files })))
        .use(
            sass({
                options: { includePaths: ['node_modules'] },
                dependenciesKey,
            }),
        );
    const files = await processAsync(metalsmith);

    switchTest(
        files['hoge.css'],
        'should generate hoge.css file',
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files);
        },
    )(
        files['hoge.css'][dependenciesKey],
        `should have "${dependenciesKey}" property in hoge.css file metadata`,
        msg => {
            t.pass(msg);
        },
        msg => {
            t.fail(msg);
            t.log(files['hoge.css']);
        },
    );

    t.deepEqual(Object.keys(files['hoge.css'][dependenciesKey]), [
        'hoge.sass',
        '../../../../node_modules/normalize.css/normalize.css',
    ]);
    t.is(
        files['hoge.css'][dependenciesKey]['hoge.sass'],
        beforeFiles['hoge.sass'],
    );
    t.is(
        files['hoge.css'][dependenciesKey][
            '../../../../node_modules/normalize.css/normalize.css'
        ],
        undefined,
    );
});
