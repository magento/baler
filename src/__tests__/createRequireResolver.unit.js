/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

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
    expect(result).toEqual({
        moduleID: 'knockoutjs/knockout',
        modulePath: 'knockoutjs/knockout.js',
        pluginID: '',
        pluginPath: '',
    });
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
    expect(result).toEqual({
        moduleID: 'knockoutjs/knockout/foo',
        modulePath: 'knockoutjs/knockout/foo.js',
        pluginID: '',
        pluginPath: '',
    });
});

test('Handles relative (to paths config, not file paths) paths when a parent module is provided', () => {
    const requireConfig = {
        map: {
            '*': {
                ko: 'knockoutjs/knockout',
            },
        },
    };
    const resolver = createRequireResolver(requireConfig);
    const result = resolver('./bindings', 'knockoutjs/knockout');
    expect(result).toEqual({
        moduleID: 'knockoutjs/bindings',
        modulePath: 'knockoutjs/bindings.js',
        pluginID: '',
        pluginPath: '',
    });
});

test('Handles traversing (paths config) upwards when parent is provided', () => {
    const resolver = createRequireResolver({});
    const result = resolver(
        '../template/renderers',
        'Magento_Ui/js/lib/knockout/bindings/after-render',
    );
    expect(result).toEqual({
        moduleID: 'Magento_Ui/js/lib/knockout/template/renderers',
        modulePath: 'Magento_Ui/js/lib/knockout/template/renderers.js',
        pluginID: '',
        pluginPath: '',
    });
});

test('paths config works', () => {
    const requireConfig = {
        paths: {
            'jquery/ui': 'jquery/jquery-ui',
        },
    };
    const resolver = createRequireResolver(requireConfig);
    const result = resolver('jquery/ui');
    expect(result).toEqual({
        moduleID: 'jquery/ui',
        modulePath: 'jquery/jquery-ui.js',
        pluginID: '',
        pluginPath: '',
    });
});

test('Handles plugins', () => {
    const requireConfig = {
        paths: {
            'ui/template': 'Magento_Ui/templates',
            text: 'mage/requirejs/text',
        },
    };
    const resolver = createRequireResolver(requireConfig);
    const result = resolver('text!ui/template/modal/modal-popup.html');
    expect(result).toEqual({
        moduleID: 'text!ui/template/modal/modal-popup.html',
        modulePath: 'Magento_Ui/templates/modal/modal-popup.html',
        pluginID: 'text',
        pluginPath: 'mage/requirejs/text.js',
    });
});

test('domReady plugin', () => {
    const resolver = createRequireResolver({});
    const result = resolver('domReady!');
    expect(result).toEqual({
        moduleID: '',
        modulePath: '',
        pluginID: 'domReady',
        pluginPath: 'domReady.js',
    });
});
