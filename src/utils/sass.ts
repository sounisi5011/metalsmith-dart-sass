import sass from 'sass';

export function isImporter(
    value: unknown,
): value is Required<sass.Options>['importer'] {
    if (Array.isArray(value)) {
        return value.every(v => !Array.isArray(v) && isImporter(v));
    }
    return typeof value === 'function';
}

export function isFunctionsItem(
    value: unknown,
): value is Required<sass.Options>['functions'][string] {
    return typeof value === 'function';
}
