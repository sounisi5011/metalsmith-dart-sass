import test from 'ava';
import Metalsmith from 'metalsmith';
import util from 'util';

import { normalizeOptions } from '../../src/options';
import { filterObjKey } from '../helpers';
import fixtures from './fixtures';

test.before(() => {
    process.chdir(fixtures());
});

// functions: Record<string, string>

test('should import a script file that defines "functions" option', async t => {
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            functions: {
                'pow($base, $exponent)': './valid-functions-pow',
                'sqrt($number)': './valid-functions-sqrt',
            },
        },
    });
    const expectedOptions = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            functions: {
                'pow($base, $exponent)': require(fixtures(
                    './valid-functions-pow',
                )),
                'sqrt($number)': require(fixtures('./valid-functions-sqrt')),
            },
        },
    });
    t.deepEqual(options, expectedOptions);
});

test('should fail import a non exist script file that defines "functions" option', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                functions: {
                    'pow($base, $exponent)': './valid-functions-pow',
                    'sqrt($number)': './non-exist',
                },
            },
        }),
        {
            instanceOf: Error,
            message: /^Loading functions option failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});

test('should fail import a script file that defines invalid "functions" option', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                functions: {
                    'pow($base, $exponent)': './valid-functions-pow',
                    'sqrt($number)': './invalid-functions',
                },
            },
        }),
        {
            instanceOf: TypeError,
            message: `Invalid functions option. Module does not export function: './invalid-functions'`,
        },
    );
});

// functions: Record<string, Record<string, unknown>>

test('If "functions" option is defined in object, script file should be imported', async t => {
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            functions: {
                'func($arg)': {
                    './valid-functions-generator': null,
                },
            },
        },
    });
    const expectedOptions = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            functions: {
                'func($arg)':
                    // Note: In order to avoid the side effects of esModuleInterop, require() is used.
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    require(fixtures('./valid-functions-generator'))(null),
            },
        },
    });
    t.deepEqual(options, expectedOptions);
});

test('should fail import a non exist script file that defines "functions" option / defined in object', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                functions: {
                    'func($arg)': {
                        './non-exist': null,
                    },
                },
            },
        }),
        {
            instanceOf: Error,
            message: /^Loading functions option generator failed: Cannot find module '\.\/non-exist'(?=[\r\n]|$)/,
        },
    );
});

test('should fail if the script file specified in the "functions" option does not export the function / defined in object', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                functions: {
                    'func($arg)': {
                        './invalid-generator': null,
                    },
                },
            },
        }),
        {
            instanceOf: TypeError,
            message: `Loading functions option generator failed. Module does not export function: './invalid-generator'`,
        },
    );
});

test('should fail import a script file that defines invalid "functions" option / defined in object', async t => {
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                functions: {
                    'func($arg)': {
                        './invalid-functions-generator': {},
                    },
                },
            },
        }),
        {
            instanceOf: TypeError,
            message: `Invalid functions option. The function exported by this module does not return function: './invalid-functions-generator'`,
        },
    );
});

test('If the number of object properties specified in the "functions" option value is not one, it should fail', async t => {
    const functions = {
        'pow($base, $exponent)': './valid-functions-pow',
        'sqrt($number)': './valid-functions-sqrt',
        'func($arg)': {
            './invalid-generator': null,
            './invalid-functions-generator': {
                xxx: {
                    yyy: {
                        zzz: {},
                    },
                },
            },
        },
    };
    await t.throwsAsync(
        normalizeOptions({}, Metalsmith(__dirname), {
            sassOptions: {
                functions,
            },
        }),
        {
            instanceOf: TypeError,
            message: [
                `Invalid functions option. The number of object properties specified in the function option value must be one. But the number of properties is 2:`,
                util
                    .inspect(filterObjKey(functions, 'func($arg)'), {
                        depth: 1,
                    })
                    .replace(/^(?!$)/gm, '  '),
            ].join('\n'),
        },
    );
});

// functions: Record<string, (...args: sass.types.SassType[]) => (sass.types.SassType | void)>

test('When "functions" option is defined by function, option value should be returned without processing', async t => {
    const functions = {
        'func()': () => {},
    };
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            functions,
        },
    });
    t.deepEqual(options.sassOptions, { functions });
    if (
        typeof options.sassOptions === 'object' &&
        options.sassOptions.functions
    ) {
        // It also compares function value references.
        // Note: This test is redundant.
        //       However, the behavior of t.deepEqual() may change due to changes in AVA specifications.
        t.is(options.sassOptions.functions['func()'], functions['func()']);
    }
});

// functions: Record<string, string | Record<string, unknown> | (...args: sass.types.SassType[]) => (sass.types.SassType | void)>

test('Even if the value of the object of the "functions" option is of various types, all values should be converted to functions', async t => {
    const func = (): void => {};
    const options = await normalizeOptions({}, Metalsmith(__dirname), {
        sassOptions: {
            functions: {
                'pow($base, $exponent)': './valid-functions-pow',
                'sqrt($number)': './valid-functions-sqrt',
                'func($arg)': { './valid-functions-generator': null },
                'func()': func,
            },
        },
    });
    t.deepEqual(options.sassOptions, {
        functions: {
            'pow($base, $exponent)': require(fixtures('./valid-functions-pow')),
            'sqrt($number)': require(fixtures('./valid-functions-sqrt')),
            // Note: In order to avoid the side effects of esModuleInterop, require() is used.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            'func($arg)': require(fixtures('./valid-functions-generator'))(
                null,
            ),
            'func()': func,
        },
    });
});
