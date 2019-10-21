import { isReadonlyOrWritableArray } from '../../src/utils/types';

export { hasProp, isObject } from '../../src/utils';

export const isArray: isReadonlyOrWritableArray = Array.isArray;

export function isTypeList<T>(
    filter: (value: unknown) => value is T,
    value: unknown,
): value is T[] {
    return Array.isArray(value) && value.every(v => filter(v));
}

export function filterObjKey<
    T extends Record<string, unknown>,
    U extends keyof T
>(obj: T, filter: ((key: keyof T) => key is U) | U): Record<U, T[U]> {
    return (Object.entries(obj) as [U, T[U]][]).reduce(
        (newObj, [prop, value]) => {
            if (typeof filter === 'function') {
                if (filter(prop)) {
                    newObj[prop] = value;
                }
            } else {
                if (filter === prop) {
                    newObj[prop] = value;
                }
            }
            return newObj;
        },
        {} as Record<U, T[U]>,
    );
}

export function flatArray<T>(array: ReadonlyArray<T | ReadonlyArray<T>>): T[] {
    return ([] as T[]).concat(...array);
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
