import Metalsmith from 'metalsmith';
import multimatch from 'multimatch';
import path from 'path';

import { hasProp, isObject } from './';

export type MetalsmithStrictWritableFiles = Record<string, unknown>;
export type MetalsmithStrictFiles = Readonly<MetalsmithStrictWritableFiles>;

type MetalsmithFileData = Metalsmith.Files[keyof Metalsmith.Files];
export interface FileInterface extends MetalsmithFileData {
    contents: Buffer;
    [index: string]: unknown;
}

export function isFile(value: unknown): value is FileInterface {
    if (isObject(value)) {
        return Buffer.isBuffer(value.contents);
    }
    return false;
}

export function getMatchedFilenameList(
    files: MetalsmithStrictFiles,
    pattern: ReadonlyArray<string>,
): string[] {
    const filenameList = Object.keys(files);
    const matchedFilenameList = multimatch(filenameList, [...pattern]);
    return matchedFilenameList;
}

export function findFile(
    files: MetalsmithStrictFiles,
    searchFilename: string,
    metalsmith?: Metalsmith,
): [string, unknown] | [null, null];
export function findFile<T>(
    files: MetalsmithStrictFiles,
    searchFilename: string,
    metalsmith: Metalsmith | undefined,
    filter: (value: unknown) => value is T,
): [string, T] | [null, null];
export function findFile<T = unknown>(
    files: MetalsmithStrictFiles,
    searchFilename: string,
    metalsmith?: Metalsmith,
    filter?: (value: unknown) => value is T,
): [string, T] | [null, null] {
    if (!filter) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        filter = (_value: unknown): _value is any => true;
    }

    if (hasProp(files, searchFilename)) {
        const filedata = files[searchFilename];
        if (filter(filedata)) {
            return [searchFilename, filedata];
        }
    }

    const fileList = Object.entries(files);
    const pathNormalizerList: ((filename: string) => string)[] = metalsmith
        ? [metalsmith.source(), metalsmith.destination()].map(pathstr =>
              metalsmith.path.bind(metalsmith, pathstr),
          )
        : [path.normalize];

    for (const pathNormalizer of pathNormalizerList) {
        const normalizeFilename = pathNormalizer(searchFilename);
        for (const [filename, filedata] of fileList) {
            if (
                filter(filedata) &&
                normalizeFilename === pathNormalizer(filename)
            ) {
                return [filename, filedata];
            }
        }
    }

    return [null, null];
}

export function addFile(
    files: MetalsmithStrictWritableFiles,
    filename: string,
    contents: string | Buffer,
    {
        originalData,
        otherData,
        metalsmith,
    }: {
        originalData?: FileInterface;
        otherData?: Record<string, unknown>;
        metalsmith?: Metalsmith;
    } = {},
): FileInterface {
    const newFile = {
        ...otherData,
        mode: '0644',
        ...originalData,
        contents: Buffer.isBuffer(contents)
            ? contents
            : Buffer.from(contents, 'utf8'),
    };

    const [foundName] = findFile(files, filename, metalsmith);
    if (typeof foundName === 'string') {
        filename = foundName;
    }

    files[filename] = newFile;
    return newFile;
}

export function promisifyPlugin(
    callback: (
        files: MetalsmithStrictWritableFiles,
        metalsmith: Metalsmith,
    ) => Promise<void>,
): Metalsmith.Plugin {
    return (files, metalsmith, done) => {
        callback(files, metalsmith)
            .then(() => done(null, files, metalsmith))
            .catch(error => done(error, files, metalsmith));
    };
}
