import createDebug from 'debug';
import Metalsmith from 'metalsmith';
import path from 'path';
import sass from 'sass';
import util from 'util';

import { InputOptions, normalizeOptions, OptionsInterface } from './options';
import { filterObj } from './utils';
import {
    addFile,
    FileInterface,
    findFile,
    getMatchedFilenameList,
    isFile,
    MetalsmithStrictFiles,
    MetalsmithStrictWritableFiles,
    promisifyPlugin,
} from './utils/metalsmith';

const debug = createDebug(require('../package.json').name);

const asyncRender = util.promisify(sass.render);

function getDependenciesRecord(
    includedFiles: ReadonlyArray<string>,
    {
        metalsmithSrcFullpath,
        files,
        metalsmith,
    }: {
        metalsmithSrcFullpath: string;
        files: MetalsmithStrictFiles;
        metalsmith?: Metalsmith;
    },
): Record<string, unknown> {
    /**
     * @see https://sass-lang.com/documentation/js-api#result-stats-includedfiles
     */
    return includedFiles.reduce<ReturnType<typeof getDependenciesRecord>>(
        (dependencies, includedFileFullpath) => {
            const dependencyFilename = path.relative(
                metalsmithSrcFullpath,
                includedFileFullpath,
            );
            const [foundFilename, foundFiledata] = findFile(
                files,
                dependencyFilename,
                metalsmith,
            );
            return {
                ...dependencies,
                [dependencyFilename]:
                    foundFilename !== null ? foundFiledata : undefined,
            };
        },
        {},
    );
}

async function processFile({
    files,
    writableFiles,
    metalsmith,
    options,
    filename,
    filedata,
}: {
    files: MetalsmithStrictFiles;
    writableFiles: MetalsmithStrictWritableFiles;
    metalsmith: Metalsmith;
    options: OptionsInterface;
    filename: string;
    filedata: FileInterface;
}): Promise<void> {
    const metalsmithSrcFullpath = metalsmith.path(metalsmith.source());
    const metalsmithDestFullpath = metalsmith.path(metalsmith.destination());

    const srcFileFullpath = path.resolve(metalsmithSrcFullpath, filename);
    const destFileFullpath = path.resolve(
        metalsmithDestFullpath,
        await options.renamer(filename),
    );
    const sassOptions = {
        ...options.options,
        file: srcFileFullpath,
        outFile: destFileFullpath,
        data: filedata.contents.toString(),
    };

    const result = await asyncRender(sassOptions);

    const dependencies: Record<string, Record<string, unknown>> | undefined =
        typeof options.dependenciesKey === 'string' &&
        options.dependenciesKey !== ''
            ? {
                  [options.dependenciesKey]: {
                      [filename]: filedata,
                      ...getDependenciesRecord(result.stats.includedFiles, {
                          metalsmithSrcFullpath,
                          files,
                          metalsmith,
                      }),
                  },
              }
            : undefined;

    const newFilename = path.relative(metalsmithDestFullpath, destFileFullpath);
    addFile(writableFiles, newFilename, result.css, {
        originalData: filedata,
        otherData: dependencies,
        metalsmith,
    });
    if (filename !== newFilename) {
        debug('done process %o, renamed to %o', filename, newFilename);
        delete writableFiles[filename];
        debug('file deleted: %o', filename);
    } else {
        debug('done process %o', filename);
    }

    if (result.map) {
        const sourceMapFullpath = `${destFileFullpath}.map`;
        const sourceMapFilename = path.relative(
            metalsmithDestFullpath,
            sourceMapFullpath,
        );
        addFile(writableFiles, sourceMapFilename, result.map, {
            otherData: dependencies,
            metalsmith,
        });
        debug('generate SourceMap: %o', sourceMapFilename);
    }
}

export = (opts: InputOptions = {}): Metalsmith.Plugin => {
    return promisifyPlugin(async (files, metalsmith) => {
        const options = await normalizeOptions(files, metalsmith, opts);
        const validFiles = filterObj(files, isFile);
        const matchedFilenameList = getMatchedFilenameList(
            validFiles,
            options.pattern,
        );
        const matchedFilenameCount = matchedFilenameList.length;

        debug(
            matchedFilenameCount > 1
                ? 'process %d files: %o'
                : 'process %d file: %o',
            matchedFilenameCount,
            matchedFilenameList,
        );

        await Promise.all(
            matchedFilenameList.map(async filename =>
                processFile({
                    files: { ...files },
                    writableFiles: files,
                    metalsmith,
                    options,
                    filename,
                    filedata: validFiles[filename],
                }),
            ),
        );
    });
};
