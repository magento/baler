import { promises as fs } from 'fs';
import { join } from 'path';
import { createRequireResolver } from './createRequireResolver';
import { MagentoRequireConfig } from './types';

export async function graphFromAMDEntry(
    baseDir: string,
    entryModuleID: string,
    requireConfig: MagentoRequireConfig,
) {
    const resolver = createRequireResolver(requireConfig, baseDir);
    const entryPath = resolver(entryModuleID);
    console.log(entryPath);
}
