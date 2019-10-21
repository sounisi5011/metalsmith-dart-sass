import deepFreeze from 'deep-freeze-strict';
import Metalsmith from 'metalsmith';
import path from 'path';
import sass from 'sass';

import {
    FileInterface,
    MetalsmithStrictFiles,
    MetalsmithStrictWritableFiles,
} from '../utils/metalsmith';
import { loadModule } from '../utils/option';
import { FunctionTypeOnly, isReadonlyOrWritableArray } from '../utils/types';
import { normalize as normalizeSassOptions } from './sass';

type OptionsGenerator<T> =
    | string
    | T
    | ((
          files: MetalsmithStrictWritableFiles,
          metalsmith: Metalsmith,
          defaultOptions: DefaultOptionsInterface,
      ) => T | Promise<T>);

export interface OptionsInterface {
    readonly pattern: ReadonlyArray<string>;
    readonly sassOptions:
        | sass.Options
        | ((context: {
              filename: string;
              filedata: FileInterface;
              sourceFileFullpath: string;
              destinationFileFullpath: string;
              metalsmith: Metalsmith;
              metalsmithFiles: MetalsmithStrictFiles;
              pluginOptions: OptionsInterface;
          }) => sass.Options | Promise<sass.Options>);
    readonly renamer: (filename: string) => string | Promise<string>;
    readonly dependenciesKey: string | false | null;
}

export interface DefaultOptionsInterface
    extends Omit<OptionsInterface, 'sassOptions'> {
    readonly sassOptions: Exclude<
        OptionsInterface['sassOptions'],
        FunctionTypeOnly<OptionsInterface['sassOptions']>
    >;
}

type InputSassImporter = string | Record<string, unknown> | sass.Importer;

type InputSassFunctionsValue =
    | string
    | Record<string, unknown>
    | Required<sass.Options>['functions'][string];

export interface InputSassOptionsInterface
    extends Omit<sass.Options, 'importer' | 'functions'> {
    importer?: InputSassImporter | InputSassImporter[];
    functions?: Record<string, InputSassFunctionsValue>;
}

export interface InputOptionsInterface
    extends Omit<OptionsInterface, 'pattern' | 'sassOptions' | 'renamer'> {
    readonly pattern: string | OptionsInterface['pattern'];
    readonly sassOptions:
        | string
        | Exclude<OptionsInterface['sassOptions'], sass.Options>
        | InputSassOptionsInterface;
    readonly renamer: string | OptionsInterface['renamer'] | boolean | null;
}

export type InputOptions = OptionsGenerator<Partial<InputOptionsInterface>>;

export const defaultOptions: DefaultOptionsInterface = deepFreeze({
    /**
     * Partial files whose names begin with an underscore should be excluded from conversion.
     * @see https://sass-lang.com/guide#topic-4
     */
    pattern: ['**/*.sass', '**/*.scss', '!**/_*'],
    plugins: [],
    sassOptions: {},
    renamer(filename) {
        const newFilename =
            path.basename(filename, path.extname(filename)) + '.css';
        return path.join(path.dirname(filename), newFilename);
    },
    dependenciesKey: false,
});

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

function normalizeRenamer(
    inputRenamer?: InputOptionsInterface['renamer'],
): OptionsInterface['renamer'] {
    if (typeof inputRenamer === 'string' && inputRenamer !== '') {
        inputRenamer = loadModule(
            inputRenamer,
            err => `Loading renamer failed: ${err.message}`,
        ) as Exclude<typeof inputRenamer, string>;
    }

    if (typeof inputRenamer === 'function') {
        return inputRenamer;
    }

    if (inputRenamer || inputRenamer === undefined) {
        return defaultOptions.renamer;
    }

    return (filename: string) => filename;
}

export async function normalizeOptions(
    files: MetalsmithStrictWritableFiles,
    metalsmith: Metalsmith,
    opts: InputOptions,
): Promise<OptionsInterface> {
    if (typeof opts === 'string') {
        opts = loadModule(
            opts,
            err => `Loading options failed: ${err.message}`,
        ) as Exclude<InputOptions, string>;
    }

    if (typeof opts === 'function') {
        opts = await opts(files, metalsmith, defaultOptions);
    }

    return {
        ...defaultOptions,
        ...opts,
        pattern: normalizePattern(opts.pattern),
        sassOptions: normalizeSassOptions(opts.sassOptions),
        renamer: normalizeRenamer(opts.renamer),
    };
}
