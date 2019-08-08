const { join } = require('path');
const { traceAMDDependencies } = require('../traceAMDDependencies');

test('Simple Require app with no config and no cycles', async () => {
    const appRoot = join(
        __dirname,
        '__fixtures__',
        'simple-require-app-no-config',
    );
    const results = await traceAMDDependencies('main', {}, appRoot);
    expect(results).toEqual({
        'main.js': ['foo.js'],
        'foo.js': ['bar.js'],
        'bar.js': [],
    });
});

test('Require app with relative import', async () => {
    const appRoot = join(
        __dirname,
        '__fixtures__',
        'require-app-relative-import',
    );
    const results = await traceAMDDependencies('main', {}, appRoot);
    expect(results).toEqual({
        'main.js': ['dir/foo.js'],
        'dir/foo.js': ['dir/bar.js'],
        'dir/bar.js': [],
    });
});

test('Require app with cycle', async () => {
    const appRoot = join(__dirname, '__fixtures__', 'require-app-with-cycle');
    const results = await traceAMDDependencies('main', {}, appRoot);
    expect(results).toEqual({
        'main.js': ['foo.js'],
        'foo.js': ['bar.js'],
        'bar.js': ['foo.js'],
    });
});
