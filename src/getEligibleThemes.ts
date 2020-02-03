/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { StoreData } from './types';

/**
 * @summary Get a list of themeIDs for every theme
 *          that is eligible for optimization. Requirements
 *          are:
 *          1. Must be a "frontend" theme
 *          2. Must not be "Magento/blank"
 *          3. Must be deployed (in pub/static)
 */
export function getEligibleThemes(store: StoreData) {
    const { components, deployedThemes } = store;

    return Object.values(components.themes)
        .filter(t => t.area === 'frontend' && t.themeID !== 'Magento/blank')
        .filter(t => deployedThemes.includes(t.themeID))
        .map(t => t.themeID);
}
