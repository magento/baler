import { bundleThemes } from '.';
import { isMagentoRoot, getDeployedThemes } from './magentoFS';

/**
 * @summary Execute the CLI
 */
export async function run(cwd: string) {
    if (!(await isMagentoRoot(cwd))) {
        console.error(
            'baler must be run from the root of a Magento 2 installation',
        );
        process.exit(1);
    }

    const { frontend } = await getDeployedThemes(cwd);
    if (!frontend.length) {
        console.error(
            'No deployed frontend themes found in "pub/static" directory. ' +
                'Run "bin/magento setup:static-content:deploy" in the root of your ' +
                'store, then run "baler" again.',
        );
        process.exit(1);
    }

    // Likely never want to bundle blank
    const themesToBundle = frontend.filter(t => t.name !== 'blank');
    const formattedThemesNames = themesToBundle
        .map(t => `  - ${t.vendor}/${t.name}`)
        .join('\n');
    console.log(`Preparing to bundle ${themesToBundle.length} themes:`);
    console.log(formattedThemesNames);

    const results = await bundleThemes(cwd, themesToBundle);
    console.log(results);
}
