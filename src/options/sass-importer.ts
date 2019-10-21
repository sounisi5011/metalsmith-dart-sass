import sass from 'sass';

import { loadOption, loadOptionGenerator } from '../utils/option';
import { isImporter } from '../utils/sass';
import { ArrayLikeOnly } from '../utils/types';
import { InputSassOptionsInterface } from '.';

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

export function normalizeImporter(
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
