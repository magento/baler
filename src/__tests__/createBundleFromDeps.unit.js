const getModuleUnderTest = () => {
    jest.resetModules();
    return require('../createBundleFromDeps');
};
const stubDateISOString = timestamp => {
    // We include a timestamp in the generated bundles. Force it to be
    // consistent so snapshot tests work as expected
    jest.spyOn(global.Date.prototype, 'toISOString').mockImplementation(
        jest.fn().mockReturnValue(timestamp),
    );
};
const stubFilePaths = mappings => {
    jest.mock('../fsPromises', () => ({
        readFile: async path => {
            if (mappings[path]) {
                return mappings[path];
            }

            throw new Error(`Failed reading ${path} in mock fs`);
        },
    }));
};

test('bundles a simple require app with no config', async () => {
    const files = {
        'foo.js': `
            define(['bar'], function(bar) {
                console.log(bar);
            });
        `,
        'bar.js': `
            define([], function() {
                return 'bar';
            });
        `,
    };
    stubFilePaths(files);
    stubDateISOString(
        'Mon Sep 16 2019 17:46:16 GMT-0500 (Central Daylight Time)',
    );
    const { createBundleFromDeps } = getModuleUnderTest();

    const results = await createBundleFromDeps(
        'core-bundle',
        ['foo', 'bar'],
        '',
        {},
        'Vendor/theme',
    );

    expect(results.bundle).toMatchSnapshot();
    expect(results.bundleFilename).toBe('core-bundle.js');
    expect(typeof results.map).toBe('string');
});
