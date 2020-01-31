/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import vm from 'vm';
import { join } from 'path';
import { trace } from './trace';
import { readFileSync } from 'fs';
import { readFile } from './fsPromises';
import { MagentoRequireConfig, Shim } from './types';
import { BalerError } from './BalerError';

const requirejs = readFileSync(require.resolve('requirejs/require.js'), 'utf8');

/**
 * @summary Reads and evaluates a Magento RequireJS config, which is
 *          a file containing `n` successive calls to `require.config`,
 *          wrapped in IIFEs. Various tricks are necessary to get all
 *          the pieces of the config that we need.
 *
 *          This uses node's `vm` module, which can be incredibly
 *          expensive. Do _not_ call in a loop. Instead, create
 *          1 resolver and re-use it
 */
export async function getRequireConfigFromDir(path: string) {
    const filepath = join(path, 'requirejs-config.js');
    const rawRequireConfig = await readFile(filepath, 'utf8').catch(() => '');
    if (!rawRequireConfig) {
        throw new BalerError(
            `Failed reading RequireJS config at path "${path}"`,
        );
    }

    try {
        const requireConfig = evaluateRawConfig(rawRequireConfig);
        return { rawRequireConfig, requireConfig };
    } catch (err) {
        throw new BalerError(
            `Failed evaluating RequireJS config at path "${path}".\nError: ${err}`,
        );
    }
}

function evaluateRawConfig(rawConfig: string) {
    trace('Evaluating raw "requirejs-config.js"');

    const sandbox: { require: Require; window: Object } = Object.create(null);
    // Support property access on window.
    // https://github.com/DrewML/baler/issues/9
    sandbox.window = {};
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

    trace(`Evaluated requirejs-config.js. Results: ${JSON.stringify(config)}`);

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
    // TODO: Deal with formatting of this JS better. See `requireConfig.unit.js`
    // for an example of how bad the formatting currently looks
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
