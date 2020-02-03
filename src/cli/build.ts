/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { BalerError } from '../BalerError';
import { collectStoreData } from '../collectStoreData';
import { getEligibleThemes } from '../getEligibleThemes';
import { optimizeThemes } from '../optimizeThemes';
import { trace } from '../trace';

export async function build(magentoRoot: string, themeIDs?: string[]) {
    trace('starting build command from cli');
    const store = await collectStoreData(magentoRoot);
    const eligibleThemes = getEligibleThemes(store);

    if (themeIDs && themeIDs.length) {
        const invalid = themeIDs.filter(id => !eligibleThemes.includes(id));
        if (invalid.length) {
            throw new BalerError(
                `You specified ${themeIDs.length} theme(s) to optimize, ` +
                    `but ${invalid.length} of them is not optimizable ` +
                    `(${invalid.join(', ')}).\n\n` +
                    `For a theme to be optimizable, it must:\n` +
                    `  - Be for the "frontend" area\n` +
                    `  - Be deployed already with bin/magento setup:static-content:deploy\n` +
                    `  - Not have the ID "Magento/blank"\n`,
            );
        }
    }

    const results = await optimizeThemes(
        magentoRoot,
        store,
        themeIDs || eligibleThemes,
    );
    console.log(
        '\nOptimization is done, but stats have not been implemented in the CLI yet',
    );
}
