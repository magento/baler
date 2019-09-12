// build.ts imports the `collectStoreData` module before our `jest.mock`
// calls for it. To work-around this, we'll get a fresh
// copy of the module for each test _after_ our mock has been installed
const getBuildMethod = () => {
    jest.resetModules();
    return require('../build').build;
};

const mockStoreData = storeData => {
    jest.mock('../../collectStoreData', () => {
        const stub = jest.fn().mockReturnValue(Promise.resolve(storeData));
        return { collectStoreData: stub };
    });
};

const luma = {
    vendor: 'Magento',
    name: 'luma',
    themeID: 'Magento/luma',
    area: 'frontend',
    path: '/does/not/matter',
};

test('Throws an actionable error for invalid theme', async () => {
    mockStoreData({
        enabledModules: [],
        components: {
            modules: {},
            themes: { 'Magento/luma': luma },
        },
        deployedThemes: ['Magento/luma'],
    });

    try {
        await getBuildMethod()('/magento/root/path', ['Magento/foo']);
    } catch (err) {
        expect(err.message).toMatchInlineSnapshot(`
            "You specified 1 theme(s) to optimize, but 1 of them is not optimizable (Magento/foo).

            For a theme to be optimizable, it must:
              - Be for the \\"frontend\\" area
              - Be deployed already with bin/magento setup:static-content:deploy
              - Not have the ID \\"Magento/blank\\"
            "
        `);
    }
});

test('Optimizes all themes when none are specified', async () => {
    mockStoreData({
        enabledModules: [],
        components: {
            modules: {},
            themes: {
                'Magento/luma': luma,
                'Magento/foo': {
                    vendor: 'Magento',
                    name: 'foo',
                    themeID: 'Magento/foo',
                    area: 'frontend',
                    path: '/a/fake/path',
                },
            },
        },
        deployedThemes: ['Magento/luma', 'Magento/foo'],
    });

    jest.mock('../../optimizeThemes');
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await getBuildMethod()('/magento/root/path');

    const optimizeMethod = require('../../optimizeThemes').optimizeThemes;
    const optimizeArgs = optimizeMethod.mock.calls[0];
    expect(optimizeArgs[2]).toEqual(['Magento/luma', 'Magento/foo']);
});
