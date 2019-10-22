import isPathInside from 'is-path-inside';
import Metalsmith from 'metalsmith';
import multimatch from 'multimatch';
import path from 'path';
import sass from 'sass';

import { omitUndefProps } from '../utils';
import { FileInterface, MetalsmithStrictFiles } from '../utils/metalsmith';
import { FunctionTypeOnly } from '../utils/types';
import { OptionsInterface, SassOptionsObjectInterface } from '.';

export { normalizeSassOptions as normalize } from './normalizer/sass';

async function func2sassOptions(
    func: FunctionTypeOnly<OptionsInterface['sassOptions']>,
    {
        files,
        metalsmith,
        options,
        filename,
        filedata,
        srcFileFullpath,
        destFileFullpath,
    }: {
        files: MetalsmithStrictFiles;
        metalsmith: Metalsmith;
        options: OptionsInterface;
        filename: string;
        filedata: FileInterface;
        srcFileFullpath: string;
        destFileFullpath: string;
    },
): Promise<sass.Options> {
    const sassOptions = await func({
        filename,
        filedata,
        sourceFileFullpath: srcFileFullpath,
        destinationFileFullpath: destFileFullpath,
        metalsmith,
        metalsmithFiles: files,
        pluginOptions: options,
    });

    if (!['boolean', 'undefined'].includes(typeof sassOptions.indentedSyntax)) {
        throw new TypeError(
            `Non-boolean values are prohibited in the indentedSyntax option of the return value of the callback function sassOptions.` +
                ` If you want to specify a glob pattern string or an array of strings, you need to specify a plain object in the sassOptions option.`,
        );
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
        inputSassOptions = await func2sassOptions(options.sassOptions, {
            files,
            metalsmith,
            options,
            filename,
            filedata,
            srcFileFullpath,
            destFileFullpath,
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
        ...omitUndefProps(inputSassOptions, [
            'indentedSyntax',
            'includePaths',
            'outputStyle',
            'indentType',
            'indentWidth',
            'linefeed',
            'sourceMap',
            'omitSourceMapUrl',
            'sourceMapContents',
            'sourceMapEmbed',
            'sourceMapRoot',
            'functions',
            'importer',
        ]),
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
