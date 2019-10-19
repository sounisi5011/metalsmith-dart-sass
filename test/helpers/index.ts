import { isReadonlyOrWritableArray } from '../../src/utils/types';

export { hasProp, isObject } from '../../src/utils';

export const isArray: isReadonlyOrWritableArray = Array.isArray;

export function isTypeList<T>(
    filter: (value: unknown) => value is T,
    value: unknown,
): value is T[] {
    return Array.isArray(value) && value.every(v => filter(v));
}

export function ignoreTypeError(callback: () => void): void {
    try {
        callback();
    } catch (error) {
        if (!(error instanceof TypeError)) {
            throw error;
        }
    }
}

function recursiveVoidFunc(): typeof recursiveVoidFunc {
    return recursiveVoidFunc;
}

export function switchTest(
    condition: boolean,
    message: string,
    successCallback: (message: string) => void,
    failCallback?: (message: string) => void,
): typeof switchTest {
    if (condition) {
        successCallback(message);
        return switchTest;
    } else {
        if (typeof failCallback === 'function') {
            failCallback(message);
        }
        return recursiveVoidFunc;
    }
}
