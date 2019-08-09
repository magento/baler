const { evaluateRequireConfig } = require('../evaluateRequireConfig');
const { readFileSync } = require('fs');

const rawConfig = readFileSync(
    require.resolve('./__fixtures__/luma-requirejs-config'),
);

test('Captures all "deps" values', () => {
    const config = evaluateRequireConfig(rawConfig);
    expect(config.deps).toEqual([
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

test('Merges map* values from various configs', () => {
    const config = evaluateRequireConfig(rawConfig);
    const mapStar = config.map['*'];
    expect(mapStar.rowBuilder).toEqual('Magento_Theme/js/row-builder');
    expect(mapStar.ko).toEqual('knockoutjs/knockout');
});

test('Merges paths values from various configs', () => {
    const config = evaluateRequireConfig(rawConfig);
    const { paths } = config;
    expect(paths['jquery/ui']).toEqual('jquery/jquery-ui');
    expect(paths['jquery/validate']).toEqual('jquery/jquery.validate');
});

test('Merges mixins config values from various configs', () => {
    const config = evaluateRequireConfig(rawConfig);
    const { mixins } = config.config;

    expect(mixins['Magento_Theme/js/view/breadcrumbs']).toEqual({
        'Magento_Theme/js/view/add-home-breadcrumb': true,
        'Magento_Catalog/js/product/breadcrumbs': true,
    });
});
