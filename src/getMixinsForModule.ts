import { MagentoRequireConfig } from './types';

export function getMixinsForModule(
    moduleID: string,
    requireConfig: MagentoRequireConfig,
): string[] {
    const mixins = requireConfig.config && requireConfig.config.mixins;
    if (!mixins) return [];

    const assignedMixins = mixins[moduleID];
    if (!assignedMixins) return [];

    const discoveredMixins = [];
    for (const [dep, enabled] of Object.entries(assignedMixins)) {
        if (enabled) discoveredMixins.push(dep);
    }

    return discoveredMixins;
}
