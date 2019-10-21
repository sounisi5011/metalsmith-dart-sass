import test from 'ava';
import Metalsmith from 'metalsmith';
import onceImporter from 'node-sass-once-importer';
import packageImporter from 'node-sass-package-importer';

import { normalizeOptions } from '../../src/options';
import { flatArray } from '../helpers';
import fixtures from './fixtures';

test.before(() => {
    process.chdir(fixtures());
});

// importer: string

test('should import a script file that defines importer option', async t => {
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer: './valid-importer',
        },
    });
    const expectedOptions = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer: require(fixtures('./valid-importer')),
        },
    });
    t.deepEqual(options, expectedOptions);
});

test('should fail import a non exist script file that defines importer option', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: './non-exist',
            },
        }),
        {
            instanceOf: Error,
            message: /^Loading importer option failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});

test('should fail import a script file that defines invalid importer option', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: './invalid-importer',
            },
        }),
        {
            instanceOf: TypeError,
            message: `Invalid importer option. Module does not export valid importer: './invalid-importer'`,
        },
    );
});

// importer: Record<string, unknown>

test('If importer option is defined in object, package should be imported', async t => {
    const packageImporterOptions = {};
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer: {
                'node-sass-once-importer': null,
                'node-sass-package-importer': packageImporterOptions,
            },
        },
    });

    if (!Array.isArray(options.sassOptions.importer)) {
        t.fail('importer option should return an array');
        t.log({
            importer: options.sassOptions.importer,
        });
        return;
    }
    t.is(options.sassOptions.importer.length, 2);
    t.is(typeof options.sassOptions.importer[0], 'function');
    t.is(String(options.sassOptions.importer[0]), String(onceImporter()));
    t.is(typeof options.sassOptions.importer[1], 'function');
    t.is(
        String(options.sassOptions.importer[1]),
        String(packageImporter(packageImporterOptions)),
    );
});

test('should fail import a non exist script file that defines importer option / defined in object', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: {
                    './non-exist': {},
                },
            },
        }),
        {
            instanceOf: Error,
            message: /^Loading importer option generator failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});

test('should fail if the script file specified in the importer option does not export the function / defined in object', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: {
                    './invalid-generator': {},
                },
            },
        }),
        {
            instanceOf: TypeError,
            message: `Loading importer option generator failed. Module does not export function: './invalid-generator'`,
        },
    );
});

test('should fail import a script file that defines invalid importer option / defined in object', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: {
                    './invalid-importer-generator': {},
                },
            },
        }),
        {
            instanceOf: TypeError,
            message: `Invalid importer option. The function exported by this module does not return valid importer: './invalid-importer-generator'`,
        },
    );
});

// importer: sass.Importer

test('When importer option is defined by function, option value should be returned without processing', async t => {
    const importer = packageImporter({});
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer,
        },
    });
    t.is(options.sassOptions.importer, importer);
});

// importer: string[]

test('should import a script file that defines importer option / defined in string array', async t => {
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer: ['./valid-importer'],
        },
    });
    const expectedOptions = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer: flatArray([
                // Note: In order to avoid the side effects of esModuleInterop, require() is used.
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require(fixtures('./valid-importer')),
            ]),
        },
    });
    t.deepEqual(options, expectedOptions);
});

test('should fail import a non exist script file that defines importer option / defined in string array', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: ['./non-exist'],
            },
        }),
        {
            instanceOf: Error,
            message: /^Loading importer option failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});

test('should fail import a script file that defines invalid importer option / defined in string array', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: ['./invalid-importer'],
            },
        }),
        {
            instanceOf: TypeError,
            message: `Invalid importer option. Module does not export valid importer: './invalid-importer'`,
        },
    );
});

// importer: Record<string, unknown>[]

test('If importer option is defined in object, package should be imported / defined in object array', async t => {
    const packageImporterOptions = {};
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer: [
                {
                    'node-sass-once-importer': null,
                    'node-sass-package-importer': packageImporterOptions,
                },
            ],
        },
    });

    if (!Array.isArray(options.sassOptions.importer)) {
        t.fail('importer option should return an array');
        t.log({
            importer: options.sassOptions.importer,
        });
        return;
    }
    t.is(options.sassOptions.importer.length, 2);
    t.is(typeof options.sassOptions.importer[0], 'function');
    t.is(String(options.sassOptions.importer[0]), String(onceImporter()));
    t.is(typeof options.sassOptions.importer[1], 'function');
    t.is(
        String(options.sassOptions.importer[1]),
        String(packageImporter(packageImporterOptions)),
    );
});

test('should fail import a non exist script file that defines importer option / defined in object array', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: [
                    {
                        './non-exist': {},
                    },
                ],
            },
        }),
        {
            instanceOf: Error,
            message: /^Loading importer option generator failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});

test('should fail if the script file specified in the importer option does not export the function / defined in object array', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: [
                    {
                        './invalid-generator': {},
                    },
                ],
            },
        }),
        {
            instanceOf: TypeError,
            message: `Loading importer option generator failed. Module does not export function: './invalid-generator'`,
        },
    );
});

test('should fail import a script file that defines invalid importer option / defined in object array', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                importer: [
                    {
                        './invalid-importer-generator': {},
                    },
                ],
            },
        }),
        {
            instanceOf: TypeError,
            message: `Invalid importer option. The function exported by this module does not return valid importer: './invalid-importer-generator'`,
        },
    );
});

// importer: sass.Importer[]

test('When importer option is defined by function array, option value must be returned without processing', async t => {
    const importer = [onceImporter(), packageImporter({})];
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer,
        },
    });
    t.is(options.sassOptions.importer, importer);
});

// importer: (string | Record<string, unknown> | sass.Importer)[]

test('Even if the array value of the importer option has various types, it is necessary to process all importers', async t => {
    const importer = (): void => {};
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            importer: [
                './valid-importer',
                { './valid-importer-generator': null },
                importer,
            ],
        },
    });
    t.deepEqual(
        options.sassOptions.importer,
        flatArray([
            require(fixtures('./valid-importer')),
            // Note: In order to avoid the side effects of esModuleInterop, require() is used.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require(fixtures('./valid-importer-generator'))(null),
            importer,
        ]),
    );
});
