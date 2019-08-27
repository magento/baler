import { optimizeThemes } from './optimizeThemes';
import { collectStoreData } from './collectStoreData';
import { log } from './log';
import { findMagentoRoot } from './magentoFS';
import { StoreData } from './types';

/**
 * @summary Execute the CLI
 */
export async function run(cwd: string) {
    const magentoRoot = await findMagentoRoot(cwd);
    if (!magentoRoot) {
        log.error('Could not find a Magento 2 installation');
        process.exit(1);
        // Shutting up TypeScript, which doesn't know that
        // process.exit halts execution
        throw void 0;
    }

    const store = await collectStoreData(magentoRoot);
    exitWithMessageIfNoDeployedThemes(store);

    const results = await optimizeThemes(magentoRoot, store, ['Magento/luma']);
    console.log(JSON.stringify(results, null, 2));
}

/**
 * @summary If no deployed themes exist in pub/static,
 *          log a descriptive warning and exit the process
 *          with an error
 */
function exitWithMessageIfNoDeployedThemes(store: StoreData): void {
    const { deployedThemes, components } = store;
    const allThemeNames = Object.values(components.themes)
        .filter(t => t.area === 'frontend' && t.themeID !== 'Magento/blank')
        .map(t => t.themeID);
    const eligibleDeployedThemes = allThemeNames.filter(id =>
        deployedThemes.includes(id),
    );

    if (eligibleDeployedThemes.length) return;

    log.error(
        "No deployed frontend theme(s) were found in your store's static directory, " +
            'but the following are installed in your store:\n' +
            allThemeNames.map(n => `  - ${n}`).join('\n'),
        '\n Try running "bin/magento setup:static-content:deploy", ' +
            'then try running "baler" again.',
    );
    process.exit(1);
}
