import util from 'util';

import { indent } from '../utils';
import { loadOption, loadOptionGenerator } from '../utils/option';
import { isFunctionsItem } from '../utils/sass';
import { InputSassOptionsInterface, SassOptionsObjectInterface } from '.';

function normalizeFunctionsEntryRecord(
    funcSignature: string,
    funcCallback: Record<string, unknown>,
): Required<SassOptionsObjectInterface>['functions'][string] {
    const funcCallbackEntries = Object.entries(funcCallback);
    if (funcCallbackEntries.length !== 1) {
        throw new TypeError(
            `Invalid functions option.` +
                ` The number of object properties specified in the function option value must be one.` +
                ` But the number of properties is ${funcCallbackEntries.length}:\n` +
                indent(
                    util.inspect(
                        { [funcSignature]: funcCallback },
                        { depth: 1 },
                    ),
                    2,
                ),
        );
    }
    const [moduleName, options] = funcCallbackEntries[0];
    return loadOptionGenerator({
        moduleName,
        options,
        optionName: 'functions',
        filter: isFunctionsItem,
        returnTypeName: 'function',
    });
}

function normalizeFunctionsEntry(
    funcSignature: string,
    funcCallback: Required<InputSassOptionsInterface>['functions'][string],
): Required<SassOptionsObjectInterface>['functions'][string] {
    if (typeof funcCallback === 'string') {
        return loadOption({
            moduleName: funcCallback,
            optionName: 'functions',
            filter: isFunctionsItem,
            returnTypeName: 'function',
        });
    }

    if (typeof funcCallback === 'function') {
        return funcCallback;
    }

    return normalizeFunctionsEntryRecord(funcSignature, funcCallback);
}

export function normalizeFunctions(
    inputFunctions: Required<InputSassOptionsInterface>['functions'],
): Required<SassOptionsObjectInterface>['functions'] {
    return Object.entries(inputFunctions).reduce<
        ReturnType<typeof normalizeFunctions>
    >((functions, [funcSignature, funcCallback]) => {
        if (funcCallback) {
            functions[funcSignature] = normalizeFunctionsEntry(
                funcSignature,
                funcCallback,
            );
        }
        return functions;
    }, {});
}
