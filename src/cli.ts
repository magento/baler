import { optimizeThemes } from './optimizeThemes';
import { collectStoreData } from './collectStoreData';
import { findMagentoRoot } from './magentoFS';
import { StoreData } from './types';
import { debugEvent } from './debug';
import { initLogListener } from './cliLogListener';

/**
 * @summary Execute the CLI
 */
export async function run(cwd: string) {
    initLogListener();

    const magentoRoot = await findMagentoRoot(cwd);
    if (!magentoRoot) {
        throw new Error(`Could not find a Magento 2 installation from ${cwd}`);
    }

    const store = await collectStoreData(magentoRoot);
    const themesToOptimize = getSupportedAndDeployedThemeIDs(store);

    if (themesToOptimize.length) {
        debugEvent({ type: 'eligibleThemes', payload: themesToOptimize });
    } else {
        throw new Error(
            'No eligible themes were found to be optimized. For a theme ' +
                'to be optimized, it must:\n\n' +
                '  - Be for the "frontend" area\n' +
                '  - Not be "Magento/blank"\n' +
                '  - Be deployed already with bin/magento setup:static-content:deploy\n',
        );
    }

    const results = await optimizeThemes(magentoRoot, store, themesToOptimize);
    // TODO: Log some summary
}

function getSupportedAndDeployedThemeIDs(store: StoreData): string[] {
    const { components, deployedThemes } = store;

    return Object.values(components.themes)
        .filter(t => t.area === 'frontend' && t.themeID !== 'Magento/blank')
        .filter(t => deployedThemes.includes(t.themeID))
        .map(t => t.themeID);
}
