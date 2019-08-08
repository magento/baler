import vm from 'vm';
import { log } from './log';
import { MagentoRequireConfig } from './types';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';

// The whole point of this module is to piggy back on
// RequireJS's path resolver so we don't have to reimplement
// it. Unfortunately the lib is not CommonJS or ES module friendly,
// so we have to use some hacks.

const requirejs = readFileSync(require.resolve('requirejs/require.js'), 'utf8');

export type Resolver = (id: string, issuingModule?: string) => string;
/**
 * @summary Create a file path resolver using the API exposed by RequireJS,
 *          taking into account paths/map/etc config
 */
export function createRequireResolver(requireConfig: MagentoRequireConfig) {
    log.debug(`Creating RequireJS resolver`);
    const sandbox: any = {};
    // RequireJS is targeted at browsers, so it doesn't
    // have a CommonJS version, and just sets a global.
    // This is a quick hack to get what we need off that global
    vm.runInNewContext(requirejs, sandbox);
    (sandbox.require as Require).config({ ...requireConfig, baseUrl: '' });

    const toUrl: Require['toUrl'] = sandbox.require.s.contexts._.require.toUrl;

    const resolver: Resolver = (id, issuingModule) => {
        log.debug(`Resolving dependency "${id}" from "${issuingModule}"`);
        if (issuingModule && id[0] === '.') {
            const parentDir = dirname(issuingModule);
            const resolvedPath = join(parentDir, id);
            return toUrl(resolvedPath);
        }

        return toUrl(id);
    };

    return resolver;
}
