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

export function findFile<T>(
    files: Readonly<Record<string, T>>,
    searchFilename: string,
    metalsmith?: Metalsmith,
): [string, T] | [null, null] {
    if (hasProp(files, searchFilename)) {
        return [searchFilename, files[searchFilename]];
    }

    const filenameList = Object.keys(files);
    if (metalsmith) {
        for (const pathNormalizer of [
            metalsmith.path.bind(metalsmith, metalsmith.source()),
            metalsmith.path.bind(metalsmith, metalsmith.destination()),
        ]) {
            const normalizedSearchFilename = pathNormalizer(searchFilename);
            for (const filename of filenameList) {
                if (normalizedSearchFilename === pathNormalizer(filename)) {
                    return [filename, files[filename]];
                }
            }
        }
    } else {
        const normalizedSearchFilename = path.normalize(searchFilename);
        for (const filename of filenameList) {
            if (normalizedSearchFilename === path.normalize(filename)) {
                return [filename, files[filename]];
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
