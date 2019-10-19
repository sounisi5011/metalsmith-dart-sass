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

export function findFilename(
    files: MetalsmithStrictFiles,
    searchFilename: string,
    metalsmith?: Metalsmith,
): string | null {
    if (hasProp(files, searchFilename)) {
        return searchFilename;
    }

    const pathNormalizerList: (typeof path.normalize)[] = metalsmith
        ? [
              metalsmith.path.bind(metalsmith, metalsmith.source()),
              metalsmith.path.bind(metalsmith, metalsmith.destination()),
          ]
        : [path.normalize];
    const filenameList = Object.keys(files);

    for (const pathNormalizer of pathNormalizerList) {
        const normalizedSearchFilename = pathNormalizer(searchFilename);
        for (const filename of filenameList) {
            if (normalizedSearchFilename === pathNormalizer(filename)) {
                return filename;
            }
        }
    }

    return null;
}

export function findFile<T>(
    files: Readonly<Record<string, T>>,
    searchFilename: string,
    metalsmith?: Metalsmith,
): [string, T] | [null, null] {
    const foundFilename = findFilename(files, searchFilename, metalsmith);

    if (typeof foundFilename === 'string') {
        return [foundFilename, files[foundFilename]];
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
