import test from 'ava';
import Metalsmith from 'metalsmith';

import { normalizeOptions } from '../../src/options';
import fixtures from './fixtures';

test.before(() => {
    process.chdir(fixtures());
});

test('should import a script file that defines options', async t => {
    const options = await normalizeOptions(
        {},
        Metalsmith(__dirname),
        './options-generator',
    );
    const expectedOptions = await normalizeOptions(
        {},
        Metalsmith(__dirname),
        // Note: In order to avoid the side effects of esModuleInterop, require() is used.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(fixtures('./options-generator')),
    );
    t.deepEqual(options, expectedOptions);
});

test('should fail import a non exist script file', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), './non-exist'),
        {
            instanceOf: Error,
            message: /^Loading options failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});
