const { getMixinsForModule } = require('../getMixinsForModule');

const requireConfig = {
    config: {
        mixins: {
            'Magento_Theme/js/view/breadcrumbs': {
                'Magento_Theme/js/view/add-home-breadcrumb': true,
                'Magento_Catalog/js/product/breadcrumbs': true,
            },
            'jquery/jquery-ui': {
                'jquery/patches/jquery-ui': true,
            },
            'foo/bar': {
                bizz: true,
                buzz: false,
            },
        },
    },
};

test('Empty list when no mixins found', () => {
    const mixins = getMixinsForModule('Magento_Theme/js/foo', requireConfig);
    expect(mixins).toEqual([]);
});

test('Finds single matching mixin', () => {
    const mixins = getMixinsForModule('jquery/jquery-ui', requireConfig);
    expect(mixins).toEqual(['jquery/patches/jquery-ui']);
});

test('Finds multiple matching mixins', () => {
    const mixins = getMixinsForModule(
        'Magento_Theme/js/view/breadcrumbs',
        requireConfig,
    );
    expect(mixins).toEqual([
        'Magento_Theme/js/view/add-home-breadcrumb',
        'Magento_Catalog/js/product/breadcrumbs',
    ]);
});

test('Empty list when config require config had no "config" settings', () => {
    const mixins = getMixinsForModule('foo', {});
    expect(mixins).toEqual([]);
});

test('Respects disabled mixins', () => {
    const mixins = getMixinsForModule('foo/bar', requireConfig);
    expect(mixins).toEqual(['bizz']);
});
