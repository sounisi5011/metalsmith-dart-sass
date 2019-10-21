import sass from 'sass';
import util from 'util';

import { hasProp, indent, loadModule } from '../utils';
import { isFunctionsItem, isImporter } from '../utils/sass';
import { ArrayLikeOnly } from '../utils/types';
import {
    defaultOptions,
    InputOptionsInterface,
    InputSassOptionsInterface,
    OptionsInterface,
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

function normalizeFunctionsEntryRecord(
    funcSignature: string,
    funcCallback: Record<string, unknown>,
): Required<sass.Options>['functions'][string] {
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
    return loadOptionGenerator({
        moduleName,
        options,
        optionName: 'functions',
        filter: isFunctionsItem,
        returnTypeName: 'function',
    });
}

function normalizeFunctionsEntry(
    funcSignature: string,
    funcCallback: Required<InputSassOptionsInterface>['functions'][string],
): Required<sass.Options>['functions'][string] {
    if (typeof funcCallback === 'string') {
        return loadOption({
            moduleName: funcCallback,
            optionName: 'functions',
            filter: isFunctionsItem,
            returnTypeName: 'function',
        });
    }

    if (typeof funcCallback === 'function') {
        return funcCallback;
    }

    return normalizeFunctionsEntryRecord(funcSignature, funcCallback);
}

function normalizeFunctions(
    inputFunctions: Required<InputSassOptionsInterface>['functions'],
): Required<sass.Options>['functions'] {
    return Object.entries(inputFunctions).reduce<
        ReturnType<typeof normalizeFunctions>
    >((functions, [funcSignature, funcCallback]) => {
        if (funcCallback) {
            functions[funcSignature] = normalizeFunctionsEntry(
                funcSignature,
                funcCallback,
            );
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
    inputOptions?: InputOptionsInterface['sassOptions'],
): OptionsInterface['sassOptions'] {
    const defaultOpts = defaultOptions.sassOptions;
    const sassOptions = { ...defaultOpts };

    if (inputOptions) {
        Object.assign(sassOptions, inputOptions);
        assignInputOption(sassOptions, 'importer', {
            inputOptions,
            defaultOpts,
            normalizer: normalizeImporter,
        });
        assignInputOption(sassOptions, 'functions', {
            inputOptions,
            defaultOpts,
            normalizer: normalizeFunctions,
        });
    }

    return sassOptions;
}
