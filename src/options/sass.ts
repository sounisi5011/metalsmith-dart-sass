import sass from 'sass';

import { hasProp, isObject } from '../utils';
import { loadModule } from '../utils/option';
import { FunctionTypeOnly } from '../utils/types';
import { defaultOptions, InputOptionsInterface, OptionsInterface } from '.';
import { normalizeFunctions } from './sass-functions';
import { normalizeImporter } from './sass-importer';

function isSassOptionsObject(value: unknown): value is sass.Options {
    return isObject(value);
}

function toSassOptionsGenerator(
    value: Function,
    { moduleName }: { moduleName: string },
): FunctionTypeOnly<OptionsInterface['sassOptions']> {
    return async (...args) => {
        const ret = await value(...args);
        if (!isSassOptionsObject(ret)) {
            throw new TypeError(
                `Invalid sassOptions option. The function exported by this module does not return object: '${moduleName}'`,
            );
        }
        return ret;
    };
}

function importSassOptions(
    moduleName: string,
): OptionsInterface['sassOptions'] {
    const exportedValue = loadModule(
        moduleName,
        err => `Loading sassOptions option failed: ${err.message}`,
    );
    if (isSassOptionsObject(exportedValue)) {
        return exportedValue;
    }
    if (typeof exportedValue === 'function') {
        return toSassOptionsGenerator(exportedValue, { moduleName });
    }
    throw new TypeError(
        `Invalid sassOptions option. Module does not export object or function: '${moduleName}'`,
    );
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

    if (typeof inputOptions === 'string') {
        return importSassOptions(inputOptions);
    }

    if (typeof inputOptions === 'function') {
        return inputOptions;
    }

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
