import {
    getEnabledModules,
    getComponents,
    getDeployedThemes,
} from './magentoFS';
import { StoreData } from './types';
import { debugEvent, debugTimer } from './debug';

/**
 * @summary Collect (in parallel) all the data needed up-front for
 *          optimization
 */
export async function collectStoreData(
    magentoRoot: string,
): Promise<StoreData> {
    const eventTime = debugTimer();
    debugEvent({ type: 'collectStoreData:start' });

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

    debugEvent({
        type: 'collectStoreData:end',
        storeData,
        timing: eventTime(),
    });

    return storeData;
}
