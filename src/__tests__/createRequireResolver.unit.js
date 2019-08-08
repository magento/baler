const { createRequireResolver } = require('../createRequireResolver');

test('Resolves a bare module identifier without a path mapped from map["*"]', () => {
    const requireConfig = {
        map: {
            '*': {
                ko: 'knockoutjs/knockout',
            },
        },
    };
    const resolver = createRequireResolver(requireConfig);
    const result = resolver('ko');
    expect(result).toBe('knockoutjs/knockout');
});

test('Resolves a path off of a map["*"] mapped value', () => {
    const requireConfig = {
        map: {
            '*': {
                ko: 'knockoutjs/knockout',
            },
        },
    };
    const resolver = createRequireResolver(requireConfig);
    const result = resolver('ko/foo');
    expect(result).toBe('knockoutjs/knockout/foo');
});

test('Handles relative paths when a parent module is provided', () => {
    const requireConfig = {
        map: {
            '*': {
                ko: 'knockoutjs/knockout',
            },
        },
    };
    const resolver = createRequireResolver(requireConfig);
    const knockoutPath = resolver('ko');
    const result = resolver('./bindings', knockoutPath);
    expect(result).toBe('knockoutjs/bindings');
});

test('Handles traversing upwards when parent is provided', () => {
    const resolver = createRequireResolver({});
    const parentPath = resolver(
        'Magento_Ui/js/lib/knockout/bindings/after-render',
    );
    const result = resolver('../template/renderers', parentPath);
    expect(result).toBe('Magento_Ui/js/lib/knockout/template/renderers');
});

test('paths config works for bare module identifier', () => {
    const requireConfig = {
        paths: {
            'jquery/ui': 'jquery/jquery-ui',
        },
    };
    const resolver = createRequireResolver(requireConfig);
    const result = resolver('jquery/ui');
    expect(result).toBe('jquery/jquery-ui');
});
