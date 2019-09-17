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
});

test('Require app with cycle', async () => {
    const appRoot = join(__dirname, '__fixtures__', 'require-app-with-cycle');
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results.graph).toEqual({
        main: ['foo'],
        foo: ['bar'],
        bar: ['foo'],
    });
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
});

test('Works with RequireJS built-ins', async () => {
    const appRoot = join(__dirname, '__fixtures__', 'require-builtins');
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results.graph).toEqual({
        main: ['exports', 'require', 'module'],
    });
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

test.todo('Throws descriptive error when file cannot be read');
