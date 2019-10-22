import { hasProp, isObject, isTypeList } from '.';

/**
 * @see https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.djovrt4kdvga
 */
export interface SourceMap {
    version: number;
    file?: string;
    sourceRoot?: string;
    sources: string[];
    sourcesContent?: (string | null)[];
    names: string[];
    mappings: string;
}

export function isValidSourceMap(value: unknown): value is SourceMap {
    return (
        isObject(value) &&
        (typeof value.version === 'number' &&
            Number.isInteger(value.version) &&
            value.version > 0 &&
            (!hasProp(value, 'file') || typeof value.file === 'string') &&
            (!hasProp(value, 'sourceRoot') ||
                typeof value.sourceRoot === 'string') &&
            isTypeList(
                (v): v is string => typeof v === 'string',
                value.sources,
            ) &&
            (!hasProp(value, 'sourcesContent') ||
                isTypeList(
                    (v): v is string | null =>
                        v === null || typeof v === 'string',
                    value.sourcesContent,
                )) &&
            isTypeList(
                (v): v is string => typeof v === 'string',
                value.names,
            ) &&
            typeof value.mappings === 'string')
    );
}

export function base64ToStr(base64Str: string): string {
    return Buffer.from(base64Str, 'base64').toString();
}

export const inlineSourceMappingURLCommentRegExp = /\/\*# sourceMappingURL=data:application\/json;base64,([a-zA-Z0-9+/=]+) \*\/$/;
