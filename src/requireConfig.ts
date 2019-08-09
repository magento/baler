import vm from 'vm';
import { log } from './log';
import { readFileSync } from 'fs';
import { MagentoRequireConfig } from './types';

const requirejs = readFileSync(require.resolve('requirejs/require.js'), 'utf8');

/**
 * @summary Evaluates a Magento RequireJS config, which is
 *          a file containing `n` successive calls to `require.config`,
 *          wrapped in IIFEs. Various tricks are necessary to get all
 *          the pieces of the config that we need
 */
export function evaluate(rawConfig: string) {
    log.debug('Evaluating raw "requirejs-config.js"');

    const sandbox: { require: Require } = Object.create(null);
    vm.createContext(sandbox);

    // Set up RequireJS in the VM
    vm.runInContext(requirejs, sandbox);

    // RequireJS immediately fetches values in `deps`, and does not
    // keep them around in the config. Let's monkey-patch the `config`
    // function to capture them
    const entryDeps: string[] = [];
    const oldConfigFn = sandbox.require.config;
    sandbox.require.config = (conf: MagentoRequireConfig) => {
        if (conf.deps) entryDeps.push(...conf.deps);
        return oldConfigFn(conf);
    };

    vm.runInContext(rawConfig, sandbox);
    const config = sandbox.require.s.contexts._.config as MagentoRequireConfig;
    config.deps = entryDeps;

    return config;
}

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

type Shim = Omit<RequireShim, 'init'>;
/**
 * @summary Normalize the various ways a shim config can be defined
 */
export function getShimsForModule(
    moduleID: string,
    requireConfig: MagentoRequireConfig,
): Shim | undefined {
    const shims = requireConfig.shim && requireConfig.shim[moduleID];
    if (!shims) return;

    if (Array.isArray(shims)) {
        return { deps: shims };
    }

    return shims;
}
