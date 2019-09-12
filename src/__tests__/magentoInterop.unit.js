const getModuleUnderTest = () => {
    jest.resetModules();
    return require('../magentoInterop');
};

test('Throws an actionable error when a failure occurs', async () => {
    expect.assertions(1);
    const { getModulesAndThemesFromMagento } = getModuleUnderTest();

    try {
        await getModulesAndThemesFromMagento('/Path/does/not/exist');
    } catch (err) {
        expect(err.message).toMatchInlineSnapshot(`
            "Unable to extract list of modules/theme from Magento.

            Common causes:
              - \\"php\\" binary not available on $PATH. The path to the PHP binary can be specified using the $BALER_PHP_PATH environment variable
              - Broken Magento installation. You can test that things are working by running \\"bin/magento module:status\\""
        `);
    }
});

test('Uses BALER_PHP_PATH when specified', async () => {
    process.env.BALER_PHP_PATH = '/custom/path/to/php';
    const stub = jest.fn().mockReturnValue(Promise.resolve({ stdout: '{}' }));
    jest.mock('execa', () => stub);

    const { getModulesAndThemesFromMagento } = getModuleUnderTest();
    await getModulesAndThemesFromMagento('/path/to/store');

    expect(stub).toHaveBeenCalledTimes(1);
    const [phpPathArg] = stub.mock.calls[0];

    expect(phpPathArg).toEqual('/custom/path/to/php');
    delete process.env.BALER_PHP_PATH;
});
