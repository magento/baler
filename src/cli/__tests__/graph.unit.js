/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { graph } = require('../graph');

test('does not throw', () => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn());
    expect(graph()).resolves;
});
