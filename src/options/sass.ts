import isPathInside from 'is-path-inside';
import Metalsmith from 'metalsmith';
import multimatch from 'multimatch';
import path from 'path';
import sass from 'sass';

import { hasProp, isObject } from '../utils';
import { FileInterface, MetalsmithStrictFiles } from '../utils/metalsmith';
import { loadModule } from '../utils/option';
import { FunctionTypeOnly } from '../utils/types';
import {
    defaultOptions,
    InputOptionsInterface,
    OptionsInterface,
    SassOptionsObjectInterface,
} from '.';
import { normalizeFunctions } from './sass-functions';
import { normalizeImporter } from './sass-importer';

function isSassOptions(value: unknown): value is sass.Options {
    return isObject(value);
}

function isSassOptionsObject(
    value: unknown,
): value is SassOptionsObjectInterface {
    return isObject(value);
}

function toSassOptionsGenerator(
    value: Function,
    { moduleName }: { moduleName: string },
): FunctionTypeOnly<OptionsInterface['sassOptions']> {
    return async (...args) => {
        const ret = await value(...args);
        if (!isSassOptions(ret)) {
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

function obj2sassOptions({
    sassOptionsObj,
    filename,
}: {
    sassOptionsObj: SassOptionsObjectInterface;
    filename: string;
}): sass.Options {
    if (typeof sassOptionsObj.sourceMap === 'string') {
        throw new TypeError(
            `String values for SASS sourceMap option are forbidden.` +
                ` The Source Map filepath must be define for each file to be processed.` +
                ` You need to specify a callback function in sassOptions and define the sourceMap option with a different value for each file.`,
        );
    }

    const { indentedSyntax, ...otherSassOptions } = sassOptionsObj;
    const sassOptions: sass.Options = {
        ...otherSassOptions,
    };

    if (typeof indentedSyntax === 'boolean') {
        throw new TypeError(
            `Boolean values for SASS indentedSyntax option are forbidden.` +
                ` The indentedSyntax option must be define for each file to be processed.` +
                ` Instead, specify a glob pattern for files where the indentedSyntax option is true.` +
                ` Alternatively, specify a callback function for the sassOptions option and specify boolean for the indentedSyntax option in the return value of the function.`,
        );
    }
    if (indentedSyntax !== undefined) {
        const indentedSyntaxPatterns = ([] as string[]).concat(indentedSyntax);
        sassOptions.indentedSyntax =
            multimatch([filename], indentedSyntaxPatterns).length > 0;
    }

    return sassOptions;
}

export async function getSassOptions({
    files,
    metalsmith,
    options,
    filename,
    filedata,
    metalsmithDestFullpath,
    srcFileFullpath,
    destFileFullpath,
}: {
    files: MetalsmithStrictFiles;
    metalsmith: Metalsmith;
    options: OptionsInterface;
    filename: string;
    filedata: FileInterface;
    metalsmithDestFullpath: string;
    srcFileFullpath: string;
    destFileFullpath: string;
}): Promise<sass.Options> {
    let inputSassOptions: sass.Options;

    if (typeof options.sassOptions === 'function') {
        inputSassOptions = await options.sassOptions({
            filename,
            filedata,
            sourceFileFullpath: srcFileFullpath,
            destinationFileFullpath: destFileFullpath,
            metalsmith,
            metalsmithFiles: files,
            pluginOptions: options,
        });
    } else {
        inputSassOptions = obj2sassOptions({
            sassOptionsObj: options.sassOptions,
            filename,
        });
    }

    if (typeof inputSassOptions.sourceMap === 'string') {
        const sourceMapFullpath = path.resolve(
            metalsmithDestFullpath,
            inputSassOptions.sourceMap,
        );
        inputSassOptions.sourceMap = sourceMapFullpath;
    }

    return {
        indentedSyntax: path.extname(srcFileFullpath) === '.sass',
        ...inputSassOptions,
        file: srcFileFullpath,
        outFile: destFileFullpath,
        data: filedata.contents.toString(),
    };
}

export function validateSassOptions({
    sassOptions,
    sourceMapFullpathSet,
    metalsmithDestFullpath,
}: {
    sassOptions: sass.Options;
    sourceMapFullpathSet: Set<string>;
    metalsmithDestFullpath: string;
}): void {
    if (typeof sassOptions.sourceMap === 'string') {
        const sourceMapFullpath = sassOptions.sourceMap;
        if (!isPathInside(sourceMapFullpath, metalsmithDestFullpath)) {
            throw new Error(
                `The filepath of the SASS sourceMap option is invalid.` +
                    ` If you specify a string for the sourceMap option, you must specify a path in the Metalsmith destination directory.`,
            );
        }
        if (sourceMapFullpathSet.has(sourceMapFullpath)) {
            throw new Error(
                `Duplicate string value SASS sourceMap option are forbidden.` +
                    ` The Source Map filepath must be define for each file to be processed.` +
                    ` You need to define the sourceMap option with a different value for each file.`,
            );
        }
        sourceMapFullpathSet.add(sourceMapFullpath);
    }
}
