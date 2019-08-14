import { bundleThemes } from '.';
import { collectStoreData } from './collectStoreData';
import { log } from './log';
import { isMagentoRoot } from './magentoFS';
import { StoreData } from './types';

/**
 * @summary Execute the CLI
 */
export async function run(cwd: string) {
    if (!(await isMagentoRoot(cwd))) {
        log.error(
            'baler must be run from the root of a Magento 2 installation',
        );
        process.exit(1);
    }

    const store = await collectStoreData(cwd);
    exitWithMessageIfNoDeployedThemes(store);

    const results = await bundleThemes(cwd, store);
    console.log('CLI run complete');
}

/**
 * @summary If no deployed themes exist in pub/static,
 *          log a descriptive warning and exit the process
 *          with an error
 */
function exitWithMessageIfNoDeployedThemes(store: StoreData): void {
    const { frontend } = store.deployedThemes;
    if (frontend.length) return;

    const allThemeNames = Object.values(store.components.themes)
        .filter(t => t.area === 'frontend')
        .map(t => t.themeID);
    log.error(
        "No deployed frontend theme(s) were found in your store's static directory, " +
            'but the following are installed in your store:\n' +
            allThemeNames.map(n => `  - ${n}`).join('\n'),
        '\n Try running "bin/magento setup:static-content:deploy", ' +
            'then try running "baler" again.',
    );
    process.exit(1);
}
