import deepFreeze from 'deep-freeze-strict';
import importCwd from 'import-cwd';
import Metalsmith from 'metalsmith';
import path from 'path';
import sass from 'sass';

import { MetalsmithStrictWritableFiles } from './utils/metalsmith';
import { isFunctionsItem, isImporter } from './utils/sass';
import { ArrayLikeOnly, isReadonlyOrWritableArray } from './utils/types';

type OptionsGenerator<T> =
    | string
    | T
    | ((
          files: MetalsmithStrictWritableFiles,
          metalsmith: Metalsmith,
          defaultOptions: OptionsInterface,
      ) => T | Promise<T>);

export interface OptionsInterface {
    readonly pattern: ReadonlyArray<string>;
    readonly options: sass.Options;
    readonly renamer: (filename: string) => string | Promise<string>;
    readonly dependenciesKey: string | false | null;
}

export type ImporterJSONType = string | Record<string, unknown>;

export interface InputSassOptionsInterface
    extends Omit<sass.Options, 'importer' | 'functions'> {
    importer?:
        | (ImporterJSONType | sass.Importer)
        | (ImporterJSONType | sass.Importer)[];
    functions?: Record<
        string,
        | ImporterJSONType
        | (Exclude<sass.Options['functions'], undefined>[string])
    >;
}

export interface InputOptionsInterface
    extends Omit<OptionsInterface, 'pattern' | 'options' | 'renamer'> {
    readonly pattern: string | OptionsInterface['pattern'];
    readonly options: InputSassOptionsInterface;
    readonly renamer: OptionsInterface['renamer'] | boolean | null;
}

export type InputOptions = OptionsGenerator<Partial<InputOptionsInterface>>;

export const defaultOptions: OptionsInterface = deepFreeze({
    /**
     * Partial files whose names begin with an underscore should be excluded from conversion.
     * @see https://sass-lang.com/guide#topic-4
     */
    pattern: ['**/*.sass', '**/*.scss', '!**/_*'],
    plugins: [],
    options: {},
    renamer(filename) {
        const newFilename =
            path.basename(filename, path.extname(filename)) + '.css';
        return path.join(path.dirname(filename), newFilename);
    },
    dependenciesKey: false,
});

function loadModule(
    moduleID: string,
    errorCallback: (error: Error) => Error | string,
): unknown {
    try {
        return importCwd(moduleID);
    } catch (error) {
        const err = errorCallback(error);
        throw typeof err === 'string' ? new Error(err) : err;
    }
}

function normalizePattern(
    inputPattern?: InputOptionsInterface['pattern'],
): OptionsInterface['pattern'] {
    if ((Array.isArray as isReadonlyOrWritableArray)(inputPattern)) {
        return inputPattern;
    }

    if (typeof inputPattern === 'string') {
        return [inputPattern];
    }

    return defaultOptions.pattern;
}

function normalizeImporter(
    inputImporter: Required<InputSassOptionsInterface>['importer'],
): Required<sass.Options>['importer'] {
    if (typeof inputImporter === 'string') {
        const moduleName = inputImporter;
        const importer = loadModule(
            moduleName,
            err => `Loading importer option failed: ${err.message}`,
        );
        if (!isImporter(importer)) {
            throw new TypeError(
                `Invalid importer option. Module does not export valid importer: '${moduleName}'`,
            );
        }
        return importer;
    }

    if (isImporter(inputImporter)) {
        return inputImporter;
    }

    if (Array.isArray(inputImporter)) {
        return inputImporter.reduce<
            ArrayLikeOnly<ReturnType<typeof normalizeImporter>>
        >((importer, inputImporter) => {
            return importer.concat(normalizeImporter(inputImporter));
        }, []);
    }

    return Object.entries(inputImporter).reduce<
        ArrayLikeOnly<ReturnType<typeof normalizeImporter>>
    >((importerList, [moduleName, opts]) => {
        const importerGenerator = loadModule(
            moduleName,
            err => `Loading importer option generator failed: ${err.message}`,
        );
        if (typeof importerGenerator !== 'function') {
            throw new TypeError(
                `Loading importer option generator failed: Module does not export function '${moduleName}'`,
            );
        }
        const importer = importerGenerator(opts);
        if (!isImporter(importer)) {
            throw new TypeError(
                `Invalid importer option. The function exported by this module does not return a valid importer: '${moduleName}'`,
            );
        }
        return importerList.concat(importer);
    }, []);
}

function normalizeSassFunctions(
    inputFunctions: Required<InputSassOptionsInterface>['functions'],
): Required<sass.Options>['functions'] {
    return Object.entries(inputFunctions).reduce<
        ReturnType<typeof normalizeSassFunctions>
    >((functions, [funcSignature, funcCallback]) => {
        if (funcCallback) {
            if (typeof funcCallback === 'string') {
                const moduleName = funcCallback;
                const func = loadModule(
                    moduleName,
                    err => `Loading functions option failed: ${err.message}`,
                );
                if (!isFunctionsItem(func)) {
                    throw new TypeError(
                        `Invalid functions option. Module does not export function: '${moduleName}'`,
                    );
                }
                functions[funcSignature] = func;
            } else if (typeof funcCallback === 'function') {
                functions[funcSignature] = funcCallback;
            } else {
                const [[moduleName, opts] = []] = Object.entries(funcCallback);
                if (moduleName) {
                    const funcGenerator = loadModule(
                        moduleName,
                        err =>
                            `Loading functions option generator failed: ${err.message}`,
                    );
                    if (typeof funcGenerator !== 'function') {
                        throw new TypeError(
                            `Loading functions option generator failed: Module does not export function '${moduleName}'`,
                        );
                    }
                    const func = funcGenerator(opts);
                    if (!isFunctionsItem(func)) {
                        throw new TypeError(
                            `Invalid functions option. The function exported by this module does not return function: '${moduleName}'`,
                        );
                    }
                    functions[funcSignature] = func;
                }
            }
        }
        return functions;
    }, {});
}

function normalizeSassOptions(
    inputOptions?: InputOptionsInterface['options'],
): sass.Options {
    const opts = { ...defaultOptions.options };

    if (inputOptions) {
        Object.assign(opts, inputOptions);

        if (inputOptions.importer) {
            opts.importer = normalizeImporter(inputOptions.importer);
        } else {
            delete opts.importer;
        }

        if (inputOptions.functions) {
            opts.functions = normalizeSassFunctions(inputOptions.functions);
        } else {
            delete opts.functions;
        }
    }

    return opts;
}

function normalizeRenamer(
    inputRenamer?: InputOptionsInterface['renamer'],
): OptionsInterface['renamer'] {
    return typeof inputRenamer === 'function'
        ? inputRenamer
        : inputRenamer || inputRenamer === undefined
        ? defaultOptions.renamer
        : (filename: string) => filename;
}

export async function normalizeOptions(
    files: MetalsmithStrictWritableFiles,
    metalsmith: Metalsmith,
    opts: InputOptions,
): Promise<OptionsInterface> {
    if (typeof opts === 'string') {
        opts = importCwd(opts) as Exclude<InputOptions, string>;
    }

    if (typeof opts === 'function') {
        opts = await opts(files, metalsmith, defaultOptions);
    }

    return {
        ...defaultOptions,
        ...opts,
        pattern: normalizePattern(opts.pattern),
        options: normalizeSassOptions(opts.options),
        renamer: normalizeRenamer(opts.renamer),
    };
}
