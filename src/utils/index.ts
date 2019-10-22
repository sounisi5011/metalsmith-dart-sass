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

export function omitUndefProps<T extends object>(
    obj: Readonly<T>,
    props: ReadonlyArray<keyof T> = [],
): T {
    const newObj = {} as T;
    for (const [prop, desc] of Object.entries(
        Object.getOwnPropertyDescriptors(obj),
    )) {
        if (
            hasProp(desc, 'value') &&
            desc.value === undefined &&
            (props.length < 1 || props.includes(prop as (keyof T)))
        ) {
            continue;
        }
        Object.defineProperty(newObj, prop, desc);
    }
    return newObj;
}

export function indent(str: string, space: string | number): string {
    if (typeof space === 'number') {
        space = ' '.repeat(space);
    }
    return str.replace(/^(?!$)/gm, space);
}
