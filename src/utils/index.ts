// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject(value: unknown): value is Record<any, unknown> {
    return typeof value === 'object' && value !== null;
}

export function hasProp<
    T extends object,
    U extends (Parameters<typeof Object.prototype.hasOwnProperty>)[0]
>(value: T, prop: U): value is T & Required<Pick<T, Extract<keyof T, U>>> {
    return Object.prototype.hasOwnProperty.call(value, prop);
}

export function filterObj<T>(
    obj: Record<string, unknown>,
    filter: (value: unknown) => value is T,
): Record<string, T> {
    return Object.entries(obj).reduce<Record<string, T>>(
        (newObj, [prop, value]) => {
            if (filter(value)) {
                newObj[prop] = value;
            }
            return newObj;
        },
        {},
    );
}

export function indent(str: string, space: string | number): string {
    if (typeof space === 'number') {
        space = ' '.repeat(space);
    }
    return str.replace(/^(?!$)/gm, space);
}
