/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { wrapP } = require('../wrapP');

test('Reject', async () => {
    const promise = Promise.reject(new Error('foo'));
    const [err, result] = await wrapP(promise);
    expect(err).toBeInstanceOf(Error);
    expect(result).toBe(undefined);
});

test('Resolve', async () => {
    const promise = Promise.resolve('foo');
    const [err, result] = await wrapP(promise);
    expect(err).toBe(null);
    expect(result).toBe('foo');
});
