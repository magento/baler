import {
    getEnabledModules,
    getComponents,
    getDeployedThemes,
} from './magentoFS';
import { StoreData } from './types';
import { cliTask } from './cliTask';

/**
 * @summary Collect (in parallel) all the data needed up-front for
 *          optimization
 */
export async function collectStoreData(
    magentoRoot: string,
): Promise<StoreData> {
    const endTask = cliTask('Collect theme/module data');

    const [enabledModules, components, deployedThemes] = await Promise.all([
        getEnabledModules(magentoRoot),
        getComponents(magentoRoot),
        getDeployedThemes(magentoRoot),
    ]);

    const storeData: StoreData = {
        enabledModules,
        components,
        deployedThemes,
    };

    endTask('Collected theme/module data');

    return storeData;
}
