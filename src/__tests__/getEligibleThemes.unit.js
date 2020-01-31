/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { getEligibleThemes } = require('../getEligibleThemes');

test('0 themes when no deployed themes exist', () => {
    const store = {
        enabledModules: [],
        deployedThemes: [],
        components: {
            themes: {
                'Magento/luma': {
                    vendor: 'Magento',
                    name: 'luma',
                    themeID: 'Magento/luma',
                    area: 'frontend',
                    path: '/some/random/path',
                },
            },
        },
    };
    expect(getEligibleThemes(store)).toEqual([]);
});

test('0 themes when store has no themes', () => {
    const store = {
        enabledModules: [],
        deployedThemes: [],
        components: {
            themes: {},
            modules: {},
        },
    };
});

test('1 theme when only theme is deployed', () => {
    const store = {
        enabledModules: [],
        deployedThemes: ['Magento/luma'],
        components: {
            themes: {
                'Magento/luma': {
                    vendor: 'Magento',
                    name: 'luma',
                    themeID: 'Magento/luma',
                    area: 'frontend',
                    path: '/some/random/path',
                },
            },
        },
    };
    expect(getEligibleThemes(store)).toEqual(['Magento/luma']);
});

test('1 theme when 2 exist, but only 1 is deployed', () => {
    const store = {
        enabledModules: [],
        deployedThemes: ['Magento/luma'],
        components: {
            themes: {
                'Magento/luma': {
                    vendor: 'Magento',
                    name: 'luma',
                    themeID: 'Magento/luma',
                    area: 'frontend',
                    path: '/some/random/path',
                },
                'Magento/foobar': {
                    vendor: 'Magento',
                    name: 'foobar',
                    themeID: 'Magento/foobar',
                    area: 'frontend',
                    path: '/some/other/random/path',
                },
            },
        },
    };
    expect(getEligibleThemes(store)).toEqual(['Magento/luma']);
});
