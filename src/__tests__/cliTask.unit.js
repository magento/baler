/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const getModuleUnderTest = () => {
    jest.resetModules();
    return require('../cliTask');
};

const mockOra = () => {
    const inst = {
        start: jest.fn(),
        succeed: jest.fn(),
    };
    inst.start.mockReturnValue(inst);
    const ora = jest.fn().mockReturnValue(inst);
    jest.mock('ora', () => ora);
    return { ora, inst };
};

test('noop when BALER_CLI_MODE is not truthy', () => {
    global.BALER_CLI_MODE = false;
    const { ora, inst } = mockOra();

    const { cliTask } = getModuleUnderTest();
    const endTask = cliTask('some string');
    endTask('another string');

    expect(ora).not.toHaveBeenCalled();
    expect(inst.start).not.toHaveBeenCalled();

    delete global.BALER_CLI_MODE;
});

test('Starts and ends cli spinner with task when BALER_CLI_MODE is truthy', () => {
    const { ora, inst } = mockOra();
    global.BALER_CLI_MODE = true;
    const { cliTask } = getModuleUnderTest();

    const endTask = cliTask('some string');
    endTask('another string');

    expect(ora).toHaveBeenCalledTimes(1);
    expect(inst.start).toHaveBeenCalledTimes(1);

    const [startMessage] = ora.mock.calls[0];
    expect(startMessage).toContain('some string');

    const [stopMessage] = inst.succeed.mock.calls[0];
    expect(stopMessage).toContain('another string');

    delete global.BALER_CLI_MODE;
});

test('preceeds message with theme when supplied', () => {
    const { ora, inst } = mockOra();
    global.BALER_CLI_MODE = true;
    const { cliTask } = getModuleUnderTest();

    cliTask('test string', 'Magento/luma');
    const [startMessage] = ora.mock.calls[0];
    expect(startMessage).toContain('Magento/luma');
});
