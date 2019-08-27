import {
    getEnabledModules,
    getComponents,
    getDeployedThemes,
} from './magentoFS';
import { StoreData } from './types';

/**
 * @summary Collect (in parallel) all the data needed up-front for
 *          optimization
 */
export async function collectStoreData(
    magentoRoot: string,
): Promise<StoreData> {
    const [enabledModules, components, deployedThemes] = await Promise.all([
        getEnabledModules(magentoRoot),
        getComponents(magentoRoot),
        getDeployedThemes(magentoRoot),
    ]);

    return { enabledModules, components, deployedThemes };
}
