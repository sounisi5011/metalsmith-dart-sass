/*
 * Modify the Array.isArray function so that it can correctly Type Guard the ReadonlyArray type.
 * @example
 *   (Array.isArray as isReadonlyOrWritableArray)(value)
 *   (<isReadonlyOrWritableArray>Array.isArray)(value)
 */
export type isReadonlyOrWritableArray = (
    value: unknown,
) => value is unknown[] | ReadonlyArray<unknown>;

export type ArrayLikeOnly<T> = T extends ReadonlyArray<unknown> ? T : never;

export type FunctionTypeOnly<T> = T extends Function ? T : never;
