import vm from 'vm';
import { trace } from './trace';
import { MagentoRequireConfig } from './types';
import { readFileSync } from 'fs';
import { parseModuleID } from './parseModuleID';

// The whole point of this module is to piggy back on
// RequireJS's path resolver so we don't have to reimplement
// it. Unfortunately the lib is not CommonJS or ES module friendly,
// so we have to use some hacks.

const requirejs = readFileSync(require.resolve('requirejs/require.js'), 'utf8');

/**
 * @summary Create a file path resolver using the API exposed by RequireJS,
 *          taking into account paths/map/etc config
 */
export function createRequireResolver(requireConfig: MagentoRequireConfig) {
    const sandbox: any = {};
    // RequireJS is targeted at browsers, so it doesn't
    // have a CommonJS version, and just sets a global.
    // This is a quick hack to get what we need off that global
    vm.runInNewContext(requirejs, sandbox);
    (sandbox.require as Require).config({ ...requireConfig, baseUrl: '' });

    const makeModuleMap: any = sandbox.require.s.contexts._.makeModuleMap;
    const toUrl: Require['toUrl'] = sandbox.require.s.contexts._.require.toUrl;
    const resolver = (requestID: string, issuingModule: string = '') => {
        trace(`Resolving dependency "${requestID}" from "${issuingModule}"`);
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

        if (id) {
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
            map.modulePath = `${toUrl(result.id)}${
                map.pluginID === 'text' ? '' : '.js'
            }`;
        }

        return map;
    };

    return resolver;
}
