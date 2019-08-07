import { bundleThemes } from '.';
import { log } from './log';
import { isMagentoRoot, getDeployedThemes } from './magentoFS';

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

    const { frontend } = await getDeployedThemes(cwd);
    if (!frontend.length) {
        log.error(
            'No deployed frontend themes found in "pub/static" directory. ' +
                'Run "bin/magento setup:static-content:deploy" in the root of your ' +
                'store, then run "baler" again.',
        );
        process.exit(1);
    }

    // Likely never want to bundle blank
    const themesToBundle = frontend.filter(t => t.name !== 'blank');
    const results = await bundleThemes(cwd, themesToBundle);
    console.log(results);
}
