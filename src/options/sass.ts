import sass from 'sass';

import { hasProp, loadModule } from '../utils';
import { isFunctionsItem, isImporter } from '../utils/sass';
import { ArrayLikeOnly } from '../utils/types';
import {
    defaultOptions,
    InputOptionsInterface,
    InputSassOptionsInterface,
} from '.';

function loadOption<T>({
    moduleName,
    optionName,
    filter,
    returnTypeName,
}: {
    moduleName: string;
    optionName: string;
    filter: (value: unknown) => value is T;
    returnTypeName: string;
}): T {
    const value = loadModule(
        moduleName,
        err => `Loading ${optionName} option failed: ${err.message}`,
    );
    if (!filter(value)) {
        throw new TypeError(
            `Invalid ${optionName} option. Module does not export ${returnTypeName}: '${moduleName}'`,
        );
    }
    return value;
}

function loadOptionGenerator<T>({
    moduleName,
    options,
    optionName,
    filter,
    returnTypeName,
}: {
    moduleName: string;
    options: unknown;
    optionName: string;
    filter: (value: unknown) => value is T;
    returnTypeName: string;
}): T {
    const generator = loadModule(
        moduleName,
        err => `Loading ${optionName} option generator failed: ${err.message}`,
    );
    if (typeof generator !== 'function') {
        throw new TypeError(
            `Loading ${optionName} option generator failed: Module does not export function '${moduleName}'`,
        );
    }

    const value = generator(options);
    if (!filter(value)) {
        throw new TypeError(
            `Invalid ${optionName} option. The function exported by this module does not return ${returnTypeName}: '${moduleName}'`,
        );
    }

    return value;
}

function normalizeImporter(
    inputImporter: Required<InputSassOptionsInterface>['importer'],
): Required<sass.Options>['importer'] {
    if (typeof inputImporter === 'string') {
        return loadOption({
            moduleName: inputImporter,
            optionName: 'importer',
            filter: isImporter,
            returnTypeName: 'valid importer',
        });
    }

    if (isImporter(inputImporter)) {
        return inputImporter;
    }

    if (Array.isArray(inputImporter)) {
        return inputImporter.reduce<
            ArrayLikeOnly<ReturnType<typeof normalizeImporter>>
        >(
            (importer, inputImporter) =>
                importer.concat(normalizeImporter(inputImporter)),
            [],
        );
    }

    return Object.entries(inputImporter).reduce<
        ArrayLikeOnly<ReturnType<typeof normalizeImporter>>
    >(
        (importerList, [moduleName, options]) =>
            importerList.concat(
                loadOptionGenerator({
                    moduleName,
                    options,
                    optionName: 'importer',
                    filter: isImporter,
                    returnTypeName: 'valid importer',
                }),
            ),
        [],
    );
}

function normalizeFunctions(
    inputFunctions: Required<InputSassOptionsInterface>['functions'],
): Required<sass.Options>['functions'] {
    return Object.entries(inputFunctions).reduce<
        ReturnType<typeof normalizeFunctions>
    >((functions, [funcSignature, funcCallback]) => {
        if (funcCallback) {
            if (typeof funcCallback === 'string') {
                functions[funcSignature] = loadOption({
                    moduleName: funcCallback,
                    optionName: 'functions',
                    filter: isFunctionsItem,
                    returnTypeName: 'function',
                });
            } else if (typeof funcCallback === 'function') {
                functions[funcSignature] = funcCallback;
            } else {
                const [[moduleName, options] = []] = Object.entries(
                    funcCallback,
                );
                if (moduleName) {
                    functions[funcSignature] = loadOptionGenerator({
                        moduleName,
                        options,
                        optionName: 'functions',
                        filter: isFunctionsItem,
                        returnTypeName: 'function',
                    });
                }
            }
        }
        return functions;
    }, {});
}

const defaultOpts = defaultOptions.options;

export function normalize(options?: InputOptionsInterface['options']) {
    const opts = { ...defaultOpts };

    if (options) {
        Object.assign(opts, options);

        if (options.importer) {
            opts.importer = normalizeImporter(options.importer);
        } else if (hasProp(defaultOpts, 'importer')) {
            opts.importer = defaultOpts.importer;
        } else {
            delete opts.importer;
        }

        if (options.functions) {
            opts.functions = normalizeFunctions(options.functions);
        } else if (hasProp(defaultOpts, 'functions')) {
            opts.functions = defaultOpts.functions;
        } else {
            delete opts.functions;
        }
    }

    return opts;
}
