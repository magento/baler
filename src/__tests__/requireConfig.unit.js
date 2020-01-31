/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const {
    getMixinsForModule,
    getShimsForModule,
    generateBundleRequireConfig,
    getRequireConfigFromDir,
} = require('../requireConfig');
const { join } = require('path');

const requireConfigDir = join(__dirname, '__fixtures__/luma-requirejs-config');

test('getMixinsForModule returns empty list when no mixins found', async () => {
    const { requireConfig } = await getRequireConfigFromDir(requireConfigDir);
    const mixins = getMixinsForModule('Magento_Theme/js/foo', requireConfig);
    expect(mixins).toEqual([]);
});

test('getMixinsForModule finds single matching mixin', async () => {
    const { requireConfig } = await getRequireConfigFromDir(requireConfigDir);
    const mixins = getMixinsForModule('jquery/jquery-ui', requireConfig);
    expect(mixins).toEqual(['jquery/patches/jquery-ui']);
});

test('getMixinsForModule finds multiple matching mixins', async () => {
    const { requireConfig } = await getRequireConfigFromDir(requireConfigDir);
    const mixins = getMixinsForModule(
        'Magento_Theme/js/view/breadcrumbs',
        requireConfig,
    );
    expect(mixins).toEqual([
        'Magento_Theme/js/view/add-home-breadcrumb',
        'Magento_Catalog/js/product/breadcrumbs',
    ]);
});

test('getMixinsForModule returns empty list when config require config had no "config" settings', () => {
    const mixins = getMixinsForModule('foo', {});
    expect(mixins).toEqual([]);
});

test('getMixinsForModule respects disabled mixins', () => {
    const requireConfig = {
        config: {
            mixins: {
                'foo/bar': {
                    bizz: true,
                },
            },
        },
    };
    const mixins = getMixinsForModule('foo/bar', requireConfig);
    expect(mixins).toEqual(['bizz']);
});

test('getShimsForModule handles flat string list of deps', () => {
    const config = {
        shim: {
            foo: ['a', 'b', 'c'],
        },
    };
    expect(getShimsForModule('foo', config)).toEqual({
        deps: ['a', 'b', 'c'],
    });
});

test('getShimsForModule handles no shim', () => {
    const config = {
        shim: {},
    };
    expect(getShimsForModule('foo', config)).toEqual(undefined);
});

test('getShimsForModule handles exports key and deps', () => {
    const config = {
        shim: {
            foo: {
                exports: 'foo',
                deps: ['a', 'b', 'c'],
            },
        },
    };
    expect(getShimsForModule('foo', config)).toEqual({
        exports: 'foo',
        deps: ['a', 'b', 'c'],
    });
});

test('getRequireConfigFromDir throws descriptive error when config cannot be found', async () => {
    expect.assertions(1);
    try {
        await getRequireConfigFromDir('/does/not/exist');
    } catch (err) {
        expect(err.message).toContain('Failed reading RequireJS config');
    }
});

test('getRequireConfigFromDir throws descriptive error when config evaluation fails', async () => {
    expect.hasAssertions();
    const configDir = join(__dirname, '__fixtures__/invalid-requirejs-config');

    try {
        await getRequireConfigFromDir(configDir);
    } catch (err) {
        expect(err.message).toContain('Failed evaluating RequireJS config');
        expect(err.message).toContain('window.fooPath');
    }
});

test('getRequireConfigFromDir does not throw on simple window property access', async () => {
    const configDir = join(
        __dirname,
        '__fixtures__/require-config-window-access',
    );
    await getRequireConfigFromDir(configDir);
});

test('evaluate captures all "deps" values', async () => {
    const { requireConfig } = await getRequireConfigFromDir(requireConfigDir);
    expect(requireConfig.deps).toEqual([
        'jquery/jquery.mobile.custom',
        'mage/common',
        'mage/dataPost',
        'mage/bootstrap',
        'jquery/jquery-migrate',
        'jquery/jquery.cookie',
        'mage/translate-inline',
        'Magento_Theme/js/responsive',
        'Magento_Theme/js/theme',
    ]);
});

test('evaluate merges map* values from various configs', async () => {
    const { requireConfig } = await getRequireConfigFromDir(requireConfigDir);
    const mapStar = requireConfig.map['*'];
    expect(mapStar.rowBuilder).toEqual('Magento_Theme/js/row-builder');
    expect(mapStar.ko).toEqual('knockoutjs/knockout');
});

test('evaluate merges paths values from various configs', async () => {
    const { requireConfig } = await getRequireConfigFromDir(requireConfigDir);
    const { paths } = requireConfig;
    expect(paths['jquery/ui']).toEqual('jquery/jquery-ui');
    expect(paths['jquery/validate']).toEqual('jquery/jquery.validate');
});

test('evaluate merges mixins config values from various configs', async () => {
    const { requireConfig } = await getRequireConfigFromDir(requireConfigDir);
    const { mixins } = requireConfig.config;

    expect(mixins['Magento_Theme/js/view/breadcrumbs']).toEqual({
        'Magento_Theme/js/view/add-home-breadcrumb': true,
        'Magento_Catalog/js/product/breadcrumbs': true,
    });
});

test('generateBundleRequireConfig appends bundles data to require config', () => {
    const originalConfig = `
        (function() {
            require.config({
                paths: {
                    'foo': 'something/foo'
                }
            })
        })();
    `;
    const newConfig = generateBundleRequireConfig(
        originalConfig,
        'core-bundle',
        ['foo', 'bar', 'bizz'],
    );

    expect(newConfig).toMatchInlineSnapshot(`
        "(function() {
            // Injected by @magento/baler. This config
            // tells RequireJS which modules are in the
            // bundle, to prevent require from trying to
            // load bundled modules from the network
            require.config({
                bundles: {
                    'balerbundles/core-bundle': [
          \\"foo\\",
          \\"bar\\",
          \\"bizz\\"
        ]
                }
            });
        })();

                (function() {
                    require.config({
                        paths: {
                            'foo': 'something/foo'
                        }
                    })
                })();
            "
    `);
});
