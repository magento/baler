import { promises as fs } from 'fs';
import { createRequireResolver } from './createRequireResolver';

export async function graphFromAMDEntry(
    entryPath: string,
    requireConfig: RequireConfig,
) {
    const resolver = createRequireResolver(requireConfig);
}
