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
export function evaluateRequireConfig(rawConfig: string) {
    log.debug('Evaluating raw "requirejs-config.js"');

    const sandbox: any = Object.create(null);
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
