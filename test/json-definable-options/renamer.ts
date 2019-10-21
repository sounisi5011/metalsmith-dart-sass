import test from 'ava';
import Metalsmith from 'metalsmith';

import { normalizeOptions } from '../../src/options';
import fixtures from './fixtures';

test.before(() => {
    process.chdir(fixtures());
});

test('should import a script file that defines renamer option', async t => {
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        renamer: './renamer-option',
    });
    const expectedOptions = await normalizeOptions({}, Metalsmith(__dirname), {
        renamer: require(fixtures('./renamer-option')),
    });
    t.deepEqual(options, expectedOptions);
});

test('should fail import a non exist script file that defines renamer option', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            renamer: './non-exist',
        }),
        {
            instanceOf: Error,
            message: /^Loading renamer failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});
