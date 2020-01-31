/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { join } = require('path');

const getFixturePath = rel => join(__dirname, '__fixtures__', rel);
const noop = () => {};

// initializeCLI.ts imports the `trace` module before our `jest.mock`
// calls against `trace.ts`. To work-around this, we'll get a fresh
// copy of the module for each test _after_ our trace mock has been
// installed
const startCLIRun = (argv, cwd) => {
    jest.resetModules();
    const { initializeCLI } = require('../initializeCLI');
    return initializeCLI(argv, cwd);
};

test('Logs useful error to stderr and exits process when magento root cannot be found', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'error').mockImplementation(noop);

    const argv = ['path/to/node', '/path/to/binary'];
    await startCLIRun(argv, '/some/missing/path');

    const [consoleErrArgs] = console.error.mock.calls;
    expect(consoleErrArgs.join('')).toContain(
        'Could not find required data from Magento store at',
    );
    expect(process.exit).toHaveBeenCalledWith(1);
});

test('Enables tracing when --trace is passed', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'error').mockImplementation(noop);
    jest.mock('../build');
    jest.mock('../../trace');

    const argv = ['/path/to/node', '/path/to/binary', '--trace'];
    await startCLIRun(argv, '/path/to/store');

    expect(require('../../trace').enableTracing).toHaveBeenCalledTimes(1);
});

test('Tracing is not enabled when --trace is not passed', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'error').mockImplementation(noop);
    jest.mock('../build');
    jest.mock('../../trace');

    const argv = ['/path/to/node', '/path/to/binary'];
    await startCLIRun(argv, '/path/to/store');

    expect(require('../../trace').enableTracing).not.toHaveBeenCalled();
});

test('build is run when build command is specified', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'error').mockImplementation(noop);
    jest.mock('../build', () => ({
        build: jest.fn().mockReturnValue(Promise.resolve()),
    }));

    const magentoRoot = getFixturePath('minimal-magento-root');
    const argv = ['/path/to/node', '/path/to/binary', 'build'];
    await startCLIRun(argv, magentoRoot);

    expect(require('../build').build).toHaveBeenCalledTimes(1);
});

test('build is run when no command is specified (aka default)', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'error').mockImplementation(noop);
    jest.mock('../build', () => ({
        build: jest.fn().mockReturnValue(Promise.resolve()),
    }));

    const magentoRoot = getFixturePath('minimal-magento-root');
    const argv = ['/path/to/node', '/path/to/binary'];
    await startCLIRun(argv, magentoRoot);

    expect(require('../build').build).toHaveBeenCalledTimes(1);
});

test('graph is run when graph command is specified', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'error').mockImplementation(noop);
    jest.mock('../graph', () => ({
        graph: jest.fn().mockReturnValue(Promise.resolve()),
    }));

    const magentoRoot = getFixturePath('minimal-magento-root');
    const argv = [
        '/path/to/node',
        '/path/to/binary',
        'graph',
        '--theme',
        'Magento/luma',
    ];
    await startCLIRun(argv, magentoRoot);

    expect(require('../graph').graph).toHaveBeenCalledTimes(1);
});

test('--help flushes help content to stdout', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'log').mockImplementation(noop);

    const magentoRoot = getFixturePath('minimal-magento-root');
    const argv = ['/path/to/node', '/path/to/binary', '--help'];
    await startCLIRun(argv, magentoRoot);

    const [logArg] = console.log.mock.calls[0];

    expect(logArg).toContain('Commands');
    expect(logArg).toContain('Usage');
});

test('graph command logs useful err and exits when theme is not specified', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'error').mockImplementation(noop);

    const magentoRoot = getFixturePath('minimal-magento-root');
    const argv = ['/path/to/node', '/path/to/binary', 'graph'];
    await startCLIRun(argv, magentoRoot);

    const [errArg] = console.error.mock.calls[0];
    expect(errArg).toContain('Must supply the ID of a theme with --theme');
    expect(process.exit).toHaveBeenCalledWith(1);
});

test('logs error and exits when an unrecognized command is specified', async () => {
    jest.spyOn(process, 'exit').mockImplementation(noop);
    jest.spyOn(console, 'error').mockImplementation(noop);

    const magentoRoot = getFixturePath('minimal-magento-root');
    const argv = ['/path/to/node', '/path/to/binary', 'foobar'];
    await startCLIRun(argv, magentoRoot);

    const [errArg] = console.error.mock.calls[0];
    expect(errArg).toContain('Unrecognized baler command');
    expect(process.exit).toHaveBeenCalledWith(1);
});
