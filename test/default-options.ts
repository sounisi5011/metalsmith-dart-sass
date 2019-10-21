import test from 'ava';
import cloneDeep from 'lodash.clonedeep';
import Metalsmith from 'metalsmith';

import sass from '../src';
import fixtures from './fixtures';
import { ignoreTypeError } from './helpers';
import { processAsync } from './helpers/metalsmith';

test('defaultOptions cannot be changed', async t => {
    const metalsmith = Metalsmith(fixtures('simple'))
        .source('src')
        .use(
            sass(async (_files, _metalsmith, defaultOptions) => {
                const originalOptions = cloneDeep(defaultOptions);

                ignoreTypeError(() => {
                    Object.assign(defaultOptions, { hoge: 'fuga' });
                });
                t.deepEqual(
                    defaultOptions,
                    originalOptions,
                    'Properties cannot be added',
                );

                ignoreTypeError(() => {
                    Object.assign(defaultOptions, { pattern: '**/.sss' });
                });
                t.deepEqual(
                    defaultOptions,
                    originalOptions,
                    'Properties cannot be changed',
                );

                ignoreTypeError(() => {
                    defaultOptions.sassOptions.sourceMap = true;
                });
                t.deepEqual(
                    defaultOptions,
                    originalOptions,
                    'Child properties cannot be changed',
                );

                return {};
            }),
        );
    await processAsync(metalsmith);
});
