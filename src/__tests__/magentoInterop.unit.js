const { getModulesAndThemesFromMagento } = require('../magentoInterop');

test('Throws an actionable error when a failure occurs', async () => {
    expect.assertions(1);

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
