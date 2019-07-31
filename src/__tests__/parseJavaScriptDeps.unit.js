const { parseJavaScriptDeps } = require('../parseJavaScriptDeps');

test('Parses top-level "define" deps in anonymous AMD module', () => {
    const input = `
        define([
            'jquery',
            'mage/apply/main',
            'Magento_Ui/js/lib/knockout/bootstrap'
        ], function ($, mage) {});
    `;

    expect(parseJavaScriptDeps(input)).toEqual([
        'jquery',
        'mage/apply/main',
        'Magento_Ui/js/lib/knockout/bootstrap',
    ]);
});

test('Parses top-level "define" deps in named AMD module', () => {
    const input = `
        define('foo', [
            'jquery',
            'mage/apply/main',
            'Magento_Ui/js/lib/knockout/bootstrap'
        ], function ($, mage) {});
    `;

    expect(parseJavaScriptDeps(input)).toEqual([
        'jquery',
        'mage/apply/main',
        'Magento_Ui/js/lib/knockout/bootstrap',
    ]);
});
