const getModuleUnderTest = () => {
    jest.resetModules();
    return require('../createBundleFromDeps');
};
const stubDateISOString = () => {
    // We include a timestamp in the generated bundles. Force it to be
    // consistent so snapshot tests work as expected
    const KNOWN_STAMP =
        'Mon Sep 16 2019 17:46:16 GMT-0500 (Central Daylight Time)';
    jest.spyOn(global.Date.prototype, 'toISOString').mockImplementation(
        jest.fn().mockReturnValue(KNOWN_STAMP),
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

test('html file loaded with text plugin gets wrapped as text module', async () => {
    stubFilePaths({
        'root/template.html': '<div>Hello World</div>',
    });
    stubDateISOString();
    const { createBundleFromDeps } = getModuleUnderTest();

    const results = await createBundleFromDeps(
        'core-bundle',
        ['text!template.html'],
        'root',
        {},
        'Vendor/theme',
    );

    expect(results.bundle).toMatchSnapshot();
});

test('non-html file loaded with text plugin gets wrapped as text module', async () => {
    stubFilePaths({
        'root/js-translation.json': '{"hello": "world" }',
    });
    stubDateISOString();
    const { createBundleFromDeps } = getModuleUnderTest();

    const results = await createBundleFromDeps(
        'core-bundle',
        ['text!js-translation.json'],
        'root',
        {},
        'Vendor/theme',
    );

    expect(results.bundle).toMatchSnapshot();
});

test('named AMD module keeps its name', async () => {
    stubFilePaths({
        'root/main.js': `
            define('main', function() {
                console.log('hello world');
            });
        `,
    });
    stubDateISOString();
    const { createBundleFromDeps } = getModuleUnderTest();

    const results = await createBundleFromDeps(
        'core-bundle',
        ['main'],
        'root',
        {},
        'Vendor/theme',
    );

    expect(results.bundle).toMatchSnapshot();
});

test('anonymous AMD module gets a name', async () => {
    stubFilePaths({
        'root/main.js': `
            define(function() {
                console.log('hello world');
            });
        `,
    });
    stubDateISOString();
    const { createBundleFromDeps } = getModuleUnderTest();

    const results = await createBundleFromDeps(
        'core-bundle',
        ['main'],
        'root',
        {},
        'Vendor/theme',
    );

    expect(results.bundle).toMatchSnapshot();
});

test('non-AMD module with shim gets converted to AMD module', async () => {
    stubFilePaths({
        'root/main.js': `
            $(function() {
                // hey look I'm using jQuery outside an AMD wrapper!
            });
        `,
    });
    stubDateISOString();
    const { createBundleFromDeps } = getModuleUnderTest();

    const results = await createBundleFromDeps(
        'core-bundle',
        ['main'],
        'root',
        {
            shim: {
                main: ['jquery'],
            },
        },
        'Vendor/theme',
    );

    expect(results.bundle).toMatchSnapshot();
});

test('non-AMD module without shim gets pseudo amd-wrapper for compat', async () => {
    stubFilePaths({
        'root/main.js': `
            $(function() {
                // hey look I'm using jQuery outside an AMD wrapper!
            });
        `,
    });
    stubDateISOString();
    const { createBundleFromDeps } = getModuleUnderTest();

    const results = await createBundleFromDeps(
        'core-bundle',
        ['main'],
        'root',
        {},
        'Vendor/theme',
    );

    expect(results.bundle).toMatchSnapshot();
});
