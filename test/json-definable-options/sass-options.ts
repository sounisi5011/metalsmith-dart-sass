import test from 'ava';
import Metalsmith from 'metalsmith';

import { normalizeOptions } from '../../src/options';
import fixtures from './fixtures';

test.before(() => {
    process.chdir(fixtures());
});

test('should import a script file that defines sassOptions option / export object', async t => {
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: './valid-sass-options-obj',
    });
    t.is(
        options.sassOptions,
        // Note: In order to avoid the side effects of esModuleInterop, require() is used.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(fixtures('./valid-sass-options-obj')),
    );
});

test('should import a script file that defines sassOptions option / export function', async t => {
    const { sassOptions } = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: './valid-sass-options-generator',
    });

    if (typeof sassOptions !== 'function') {
        t.fail('sassOptions option should be a function');
        t.log({ sassOptions });
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context: Parameters<typeof sassOptions>[0] = {} as any;
    t.is(
        await sassOptions(context),
        // Note: In order to avoid the side effects of esModuleInterop, require() is used.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        await require(fixtures('./valid-sass-options-generator'))(context),
    );
});

test('should fail import a non exist script file that defines sassOptions option', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: './non-exist',
        }),
        {
            instanceOf: Error,
            message: /^Loading sassOptions option failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});

test('should fail import a script file that defines invalid sassOptions option', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: './invalid-sass-options',
        }),
        {
            instanceOf: TypeError,
            message: `Invalid sassOptions option. Module does not export object or function: './invalid-sass-options'`,
        },
    );
});

test('should fail if define a script file with the sassOptions option and the exported function does not return an object', async t => {
    const { sassOptions } = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: './invalid-sass-options-generator',
    });

    if (typeof sassOptions !== 'function') {
        t.fail('sassOptions option should be a function');
        t.log({ sassOptions });
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context: Parameters<typeof sassOptions>[0] = {} as any;
    await t.throwsAsync(async () => sassOptions(context), {
        instanceOf: TypeError,
        message: `Invalid sassOptions option. The function exported by this module does not return object: './invalid-sass-options-generator'`,
    });
});
