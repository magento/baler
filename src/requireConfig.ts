import vm from 'vm';
import { join } from 'path';
import { log } from './log';
import { readFileSync } from 'fs';
import { readFile } from './fsPromises';
import { MagentoRequireConfig, Shim } from './types';

const requirejs = readFileSync(require.resolve('requirejs/require.js'), 'utf8');

/**
 * @summary Evaluates a Magento RequireJS config, which is
 *          a file containing `n` successive calls to `require.config`,
 *          wrapped in IIFEs. Various tricks are necessary to get all
 *          the pieces of the config that we need.
 *
 *          This uses node's `vm` module, which can be incredibly
 *          expensive. Do _not_ call in a loop. Instead, create
 *          1 resolver and re-use it
 */
export function evaluate(rawConfig: string) {
    try {
        return evaluateRawConfig(rawConfig);
    } catch {
        throw new Error('Failed evaluating "requirejs-config.js"');
    }
}

function evaluateRawConfig(rawConfig: string) {
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

/**
 * @summary Add `bundles` configuration to an existing
 *          `requirejs-config.js`, to prevent Require
 *          from going to the network to load modules
 *          that are in-flight inside of a bundle
 * @todo hardcoded `balerbundles` is also hardcoded in `index.ts`
 */
export function generateBundleRequireConfig(
    rawConfig: string,
    bundleID: string,
    bundledDeps: string[],
) {
    return `(function() {
    // Injected by @magento/baler. This config
    // tells RequireJS which modules are in the
    // bundle, to prevent require from trying to
    // load bundled modules from the network
    require.config({
        bundles: {
            'balerbundles/${bundleID}': ${JSON.stringify(bundledDeps, null, 2)}
        }
    });
})();
${rawConfig}`;
}

export async function getRequireConfigFromDir(path: string) {
    const filepath = join(path, 'requirejs-config.js');
    try {
        const rawRequireConfig = await readFile(filepath, 'utf8');
        const requireConfig = evaluateRawConfig(rawRequireConfig);
        return { rawRequireConfig, requireConfig };
    } catch {
        throw new Error(
            `Failed reading or evaluating RequireJS config at path "${path}"`,
        );
    }
}
