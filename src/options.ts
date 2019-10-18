import deepFreeze from 'deep-freeze-strict';
import Metalsmith from 'metalsmith';
import path from 'path';
import sass from 'sass';

import { MetalsmithStrictWritableFiles } from './utils/metalsmith';
import { isReadonlyOrWritableArray } from './utils/types';

type OptionsGenerator<T> =
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

export interface InputOptionsInterface
    extends Omit<OptionsInterface, 'pattern' | 'renamer'> {
    readonly pattern: string | OptionsInterface['pattern'];
    readonly renamer: OptionsInterface['renamer'] | boolean | null;
}

export type InputOptions = OptionsGenerator<Partial<InputOptionsInterface>>;

export const defaultOptions: OptionsInterface = deepFreeze({
    pattern: ['**/*.css'],
    plugins: [],
    options: {},
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
    if (typeof opts === 'function') {
        opts = await opts(files, metalsmith, defaultOptions);
    }

    return {
        ...defaultOptions,
        ...opts,
        pattern: normalizePattern(opts.pattern),
        renamer: normalizeRenamer(opts.renamer),
    };
}
