const { join } = require('path');
const { traceAMDDependencies } = require('../traceAMDDependencies');

test('Simple Require app with no config and no cycles', async () => {
    const appRoot = join(
        __dirname,
        '__fixtures__',
        'simple-require-app-no-config',
    );
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results).toEqual({
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
    expect(results).toEqual({
        main: ['dir/foo'],
        'dir/foo': ['dir/bar'],
        'dir/bar': [],
    });
});

test('Require app with cycle', async () => {
    const appRoot = join(__dirname, '__fixtures__', 'require-app-with-cycle');
    const results = await traceAMDDependencies(['main'], {}, appRoot);
    expect(results).toEqual({
        main: ['foo'],
        foo: ['bar'],
        bar: ['foo'],
    });
});

test.todo('Works with text! dependency on html file');
test.todo('Throws descriptive error when file cannot be read');
test.todo('Works with RequireJS built-ins (module, require, exports)');
