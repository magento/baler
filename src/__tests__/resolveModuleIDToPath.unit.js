/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { resolvedModuleIDToPath } = require('../resolvedModuleIDToPath');

test('no extension', () => {
    expect(resolvedModuleIDToPath('foo', 'base')).toBe('base/foo.js');
});

test('.js extension', () => {
    expect(resolvedModuleIDToPath('foo.js', 'base')).toBe('base/foo.js');
});

test('.html extension', () => {
    expect(resolvedModuleIDToPath('foo.html', 'base')).toBe('base/foo.html');
});
