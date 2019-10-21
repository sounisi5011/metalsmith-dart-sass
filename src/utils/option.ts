import importCwd from 'import-cwd';

export function loadModule(
    moduleID: string,
    errorCallback: (error: Error) => Error | string,
): unknown {
    try {
        return importCwd(moduleID);
    } catch (error) {
        const err = errorCallback(error);
        throw typeof err === 'string' ? new Error(err) : err;
    }
}

export function loadOption<T>({
    moduleName,
    optionName,
    filter,
    returnTypeName,
}: {
    moduleName: string;
    optionName: string;
    filter: (value: unknown) => value is T;
    returnTypeName: string;
}): T {
    const value = loadModule(
        moduleName,
        err => `Loading ${optionName} option failed: ${err.message}`,
    );
    if (!filter(value)) {
        throw new TypeError(
            `Invalid ${optionName} option. Module does not export ${returnTypeName}: '${moduleName}'`,
        );
    }
    return value;
}

export function loadOptionGenerator<T>({
    moduleName,
    options,
    optionName,
    filter,
    returnTypeName,
}: {
    moduleName: string;
    options: unknown;
    optionName: string;
    filter: (value: unknown) => value is T;
    returnTypeName: string;
}): T {
    const generator = loadModule(
        moduleName,
        err => `Loading ${optionName} option generator failed: ${err.message}`,
    );
    if (typeof generator !== 'function') {
        throw new TypeError(
            `Loading ${optionName} option generator failed. Module does not export function: '${moduleName}'`,
        );
    }

    const value = generator(options);
    if (!filter(value)) {
        throw new TypeError(
            `Invalid ${optionName} option. The function exported by this module does not return ${returnTypeName}: '${moduleName}'`,
        );
    }

    return value;
}
