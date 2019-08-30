const {
    evaluate,
    getMixinsForModule,
    getShimsForModule,
} = require('../requireConfig');
const { readFileSync } = require('fs');

const rawConfig = readFileSync(
    require.resolve('./__fixtures__/luma-requirejs-config'),
);

test('evaluate does not throw on simple window property access', () => {
    const config = `
        (function(require) {
            var foo = window.foo;
        })(require);
    `;
    expect(() => evaluate(config)).not.toThrow();
});

test('evaluate captures all "deps" values', () => {
    const config = evaluate(rawConfig);
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

test('evaluate merges map* values from various configs', () => {
    const config = evaluate(rawConfig);
    const mapStar = config.map['*'];
    expect(mapStar.rowBuilder).toEqual('Magento_Theme/js/row-builder');
    expect(mapStar.ko).toEqual('knockoutjs/knockout');
});

test('evaluate merges paths values from various configs', () => {
    const config = evaluate(rawConfig);
    const { paths } = config;
    expect(paths['jquery/ui']).toEqual('jquery/jquery-ui');
    expect(paths['jquery/validate']).toEqual('jquery/jquery.validate');
});

test('evaluate merges mixins config values from various configs', () => {
    const config = evaluate(rawConfig);
    const { mixins } = config.config;

    expect(mixins['Magento_Theme/js/view/breadcrumbs']).toEqual({
        'Magento_Theme/js/view/add-home-breadcrumb': true,
        'Magento_Catalog/js/product/breadcrumbs': true,
    });
});

test('getMixinsForModule returns empty list when no mixins found', () => {
    const mixins = getMixinsForModule(
        'Magento_Theme/js/foo',
        evaluate(rawConfig),
    );
    expect(mixins).toEqual([]);
});

test('getMixinsForModule finds single matching mixin', () => {
    const mixins = getMixinsForModule('jquery/jquery-ui', evaluate(rawConfig));
    expect(mixins).toEqual(['jquery/patches/jquery-ui']);
});

test('getMixinsForModule finds multiple matching mixins', () => {
    const mixins = getMixinsForModule(
        'Magento_Theme/js/view/breadcrumbs',
        evaluate(rawConfig),
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
