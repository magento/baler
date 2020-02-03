/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { join } = require('path');
const { traceAMDDependencies } = require('../traceAMDDependencies');

test('Simple Require app with no config and no cycles', async () => {
    const appRoot = join(
        __dirname,
        '__fixtures__',
        'simple-require-app-no-config',
    );
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results.graph).toEqual({
        main: ['foo'],
        foo: ['bar'],
        bar: [],
    });
    expect(results.warnings).toHaveLength(0);
});

test('Require app with relative import', async () => {
    const appRoot = join(
        __dirname,
        '__fixtures__',
        'require-app-relative-import',
    );
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results.graph).toEqual({
        main: ['dir/foo'],
        'dir/foo': ['dir/bar'],
        'dir/bar': [],
    });
    expect(results.warnings).toHaveLength(0);
});

test('Require app with cycle', async () => {
    const appRoot = join(__dirname, '__fixtures__', 'require-app-with-cycle');
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results.graph).toEqual({
        main: ['foo'],
        foo: ['bar'],
        bar: ['foo'],
    });
    expect(results.warnings).toHaveLength(0);
});

test('Works with text! dependency on html file', async () => {
    const appRoot = join(
        __dirname,
        '__fixtures__',
        'html-dependency-from-main',
    );
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results.graph).toEqual({
        main: ['text!template.html', 'text'],
        'text!template.html': [],
        text: [],
    });
    expect(results.warnings).toHaveLength(0);
});

test('Works with RequireJS built-ins', async () => {
    const appRoot = join(__dirname, '__fixtures__', 'require-builtins');
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results.graph).toEqual({
        main: ['exports', 'require', 'module'],
    });
    expect(results.warnings).toHaveLength(0);
});

test('Gets lossy graph + warning when dependency cannot be found', async () => {
    const appRoot = join(__dirname, '__fixtures__', 'missing-dep');
    const results = await traceAMDDependencies(['main'], {}, appRoot);

    expect(results.graph).toEqual({
        main: ['foo'],
        foo: [],
    });

    expect(results.warnings).toHaveLength(1);
    const [warning] = results.warnings;
    expect(warning.type).toBe('UnreadableDependencyWarning');
    expect(warning.resolvedID).toBe('foo');
    expect(warning.issuer).toBe('main');
});

// Note: This is not necessarily the desired behavior - an early error for an entry point would
// be ideal. However, the test now is just to track current behavior
test('A missing entry point yields an incomplete graph with that entry + a warning', async () => {
    const results = await traceAMDDependencies(['main'], {}, '/some/fake/path');
    expect(results.graph).toEqual({
        main: [],
    });
    expect(results.warnings).toHaveLength(1);
});

test('Works with mixin config', async () => {
    const appRoot = join(__dirname, '__fixtures__', 'require-app-with-mixin');
    const requireConfig = {
        config: {
            mixins: {
                foo: {
                    'foo-mixin': true,
                },
            },
        },
    };
    const results = await traceAMDDependencies(
        ['main'],
        requireConfig,
        appRoot,
    );
    expect(results.graph).toEqual({
        main: ['foo'],
        foo: ['foo-mixin', 'module'],
        'foo-mixin': ['require'],
    });
    expect(results.warnings).toHaveLength(0);
});
