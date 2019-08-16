import vm from 'vm';
import { log } from './log';
import { MagentoRequireConfig } from './types';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { parseModuleID } from './parseModuleID';

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

export function createRequireResolverNew(requireConfig: MagentoRequireConfig) {
    const sandbox: any = {};
    vm.runInNewContext(requirejs, sandbox);
    (sandbox.require as Require).config({ ...requireConfig, baseUrl: '' });

    const makeModuleMap: any = sandbox.require.s.contexts._.makeModuleMap;
    const toUrl: Require['toUrl'] = sandbox.require.s.contexts._.require.toUrl;
    const resolver = (requestID: string, issuingModule: string = '') => {
        const { id, plugin } = parseModuleID(requestID);
        const map = {
            moduleID: '',
            modulePath: '',
            pluginID: '',
            pluginPath: '',
        };

        if (plugin) {
            const { moduleID, modulePath } = resolver(plugin);
            map.pluginID = moduleID;
            map.pluginPath = modulePath;
        }

        const parentModuleMap = {
            id: issuingModule,
            name: issuingModule,
            originalName: issuingModule,
            unnormalized: false,
            url: toUrl(issuingModule),
        };

        const result = makeModuleMap(id, parentModuleMap, false, true);

        map.moduleID = map.pluginID
            ? `${map.pluginID}!${result.id}`
            : result.id;
        map.modulePath = toUrl(result.id);

        return map;
    };

    return resolver;
}
