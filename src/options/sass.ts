import sass from 'sass';
import util from 'util';

import { hasProp, indent, loadModule } from '../utils';
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
            `Loading ${optionName} option generator failed. Module does not export function: '${moduleName}'`,
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

function normalizeImporterRecord(
    inputImporter: Record<string, unknown>,
): ArrayLikeOnly<Required<sass.Options>['importer']> {
    return Object.entries(inputImporter).reduce<
        ReturnType<typeof normalizeImporterRecord>
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

    return normalizeImporterRecord(inputImporter);
}

function normalizeFunctionsEntry({
    functions,
    funcSignature,
    funcCallback,
}: {
    functions: Required<sass.Options>['functions'];
    funcSignature: string;
    funcCallback: Required<InputSassOptionsInterface>['functions'][string];
}): void {
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
        const funcCallbackEntries = Object.entries(funcCallback);
        if (funcCallbackEntries.length !== 1) {
            throw new TypeError(
                `Invalid functions option.` +
                    ` The number of object properties specified in the function option value must be one.` +
                    ` But the number of properties is ${funcCallbackEntries.length}:\n` +
                    indent(
                        util.inspect(
                            { [funcSignature]: funcCallback },
                            { depth: 1 },
                        ),
                        2,
                    ),
            );
        }
        const [moduleName, options] = funcCallbackEntries[0];
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

function normalizeFunctions(
    inputFunctions: Required<InputSassOptionsInterface>['functions'],
): Required<sass.Options>['functions'] {
    return Object.entries(inputFunctions).reduce<
        ReturnType<typeof normalizeFunctions>
    >((functions, [funcSignature, funcCallback]) => {
        if (funcCallback) {
            normalizeFunctionsEntry({ functions, funcSignature, funcCallback });
        }
        return functions;
    }, {});
}

function assignInputOption<
    T extends object,
    U extends object,
    P extends keyof T & keyof U
>(
    options: T,
    prop: P,
    {
        inputOptions,
        defaultOpts,
        normalizer,
    }: {
        inputOptions: U;
        defaultOpts: T;
        normalizer: (input: Required<U>[P]) => Required<T>[P];
    },
): void {
    if (inputOptions[prop]) {
        options[prop] = normalizer(inputOptions[prop]);
    } else if (hasProp(defaultOpts, prop)) {
        options[prop] = defaultOpts[prop];
    } else {
        delete options[prop];
    }
}

export function normalize(
    inputOptions?: InputOptionsInterface['options'],
): sass.Options {
    const defaultOpts = defaultOptions.options;
    const options = { ...defaultOpts };

    if (inputOptions) {
        Object.assign(options, inputOptions);
        assignInputOption(options, 'importer', {
            inputOptions,
            defaultOpts,
            normalizer: normalizeImporter,
        });
        assignInputOption(options, 'functions', {
            inputOptions,
            defaultOpts,
            normalizer: normalizeFunctions,
        });
    }

    return options;
}
