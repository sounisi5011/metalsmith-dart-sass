import test from 'ava';
import Metalsmith from 'metalsmith';
import util from 'util';

import sass from '../src';
import fixtures from './fixtures';
import { processAsync } from './helpers/metalsmith';

for (const indentedSyntax of ['**/*.x-sass', ['**/*', '!**/*.x-scss']]) {
    test(
        'SASS indentedSyntax option with glob pattern should work: set indentedSyntax option to ' +
            util.inspect(indentedSyntax),
        async t => {
            const metalsmith = Metalsmith(fixtures('custom-syntax'))
                .source('src')
                .use(
                    sass({
                        pattern: '**/*.x-{sass,scss}',
                        sassOptions: {
                            indentedSyntax,
                        },
                    }),
                );
            await t.notThrowsAsync(processAsync(metalsmith));
        },
    );

    test(
        'Specifying a glob pattern with the SASS indentedSyntax option in the return value of the sassOptions callback function should fail: set indentedSyntax option to ' +
            util.inspect(indentedSyntax),
        async t => {
            const metalsmith = Metalsmith(fixtures('simple'))
                .source('src')
                .use(
                    sass({
                        sassOptions() {
                            return {
                                indentedSyntax:
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    indentedSyntax as any,
                            };
                        },
                    }),
                );
            await t.throwsAsync(processAsync(metalsmith), {
                instanceOf: TypeError,
                message:
                    `Non-boolean values are prohibited in the indentedSyntax option of the return value of the callback function sassOptions.` +
                    ` If you want to specify a glob pattern string or an array of strings, you need to specify a plain object in the sassOptions option.`,
            });
        },
    );
}

test('should work if specify a boolean for the indentedSyntax option in the return value of the sassOptions callback function', async t => {
    const metalsmith = Metalsmith(fixtures('custom-syntax'))
        .source('src')
        .use(
            sass({
                pattern: '**/*.x-{sass,scss}',
                sassOptions({ filename }) {
                    return {
                        indentedSyntax: filename.endsWith('.x-sass'),
                    };
                },
            }),
        );
    await t.notThrowsAsync(processAsync(metalsmith));
});

for (const indentedSyntax of [true, false]) {
    test(
        'Specifying boolean for the sassOptions option should fail: set indentedSyntax option to ' +
            util.inspect(indentedSyntax),
        async t => {
            const metalsmith = Metalsmith(fixtures('simple'))
                .source('src')
                .use(
                    sass({
                        sassOptions: {
                            indentedSyntax:
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                indentedSyntax as any,
                        },
                    }),
                );
            await t.throwsAsync(processAsync(metalsmith), {
                instanceOf: TypeError,
                message:
                    `Boolean values for SASS indentedSyntax option are forbidden.` +
                    ` The indentedSyntax option must be define for each file to be processed.` +
                    ` Instead, specify a glob pattern for files where the indentedSyntax option is true.` +
                    ` Alternatively, specify a callback function for the sassOptions option and specify boolean for the indentedSyntax option in the return value of the function.`,
            });
        },
    );
}
