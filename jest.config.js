/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            diagnostics: false,
        },
    },
    testPathIgnorePatterns: ['/node_modules|__fixtures__/'],
};
