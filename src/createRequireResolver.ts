import vm from 'vm';
import { readFileSync } from 'fs';
import { join, dirname, extname } from 'path';

// The whole point of this module is to piggy back on
// RequireJS's path resolver so we don't have to reimplement
// it. Unfortunately the lib is not CommonJS or ES module friendly,
// so we have to use some hacks.

const requirejs = readFileSync(require.resolve('requirejs/require.js'), 'utf8');

export type Resolver = (id: string, parentModulePath?: string) => string;
/**
 * @summary Create a file path resolver using the API exposed by RequireJS,
 *          taking into account paths/map/etc config
 */
export function createRequireResolver(requireConfig: RequireConfig) {
    const sandbox: any = {};
    // RequireJS is targeted at browsers, so it doesn't
    // have a CommonJS version, and just sets a global.
    // This is a quick hack to get what we need off that global
    vm.runInNewContext(requirejs, sandbox);
    (sandbox.require as Require).config({ ...requireConfig, baseUrl: '' });

    const toUrl: Require['toUrl'] = sandbox.require.s.contexts._.require.toUrl;

    const resolver: Resolver = (id, parentModulePath) => {
        if (parentModulePath && id[0] === '.') {
            const parentDir = dirname(parentModulePath);
            const resolvedPath = join(parentDir, id);
            return fixExt(toUrl(resolvedPath));
        }

        return fixExt(toUrl(id));
    };

    return resolver;
}

const fixExt = (path: string) => (extname(path) ? path : `${path}.js`);
