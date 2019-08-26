import { bundleThemes } from '.';
import { collectStoreData } from './collectStoreData';
import { log } from './log';
import { isMagentoRoot } from './magentoFS';
import { StoreData, BundleResult } from './types';
import chalk from 'chalk';

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
    console.log(generateReadableSummary(results));
}

function generateReadableSummary(results: BundleResult[]): string {
    const header = [
        chalk.green(
            `Finished analyzing and packaging bundles for ${results.length} theme(s).\n`,
        ),
        `Details:\n\n`,
    ].join('');

    const themeRows = results
        .map(r => {
            return [
                `Theme: ${r.themeID}\n`,
                `Bundle File: ${r.bundleFilename}\n`,
                `Module Count: ${r.deps.length}`,
            ].join('');
        })
        .join('');

    return `${header}${themeRows}`;
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
