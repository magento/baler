import vm from 'vm';
import { readFileSync } from 'fs';
import { MagentoRequireConfig } from './types';

const requirejs = readFileSync(require.resolve('requirejs/require.js'), 'utf8');

/**
 * @summary Evaluates a Magento RequireJS config, which is
 *          a file containing `n` successive calls to `require.config`
 */
export function evaluateRequireConfig(rawConfig: string) {
    const sandbox = Object.create(null);
    vm.runInNewContext(`${requirejs};${rawConfig}`, sandbox);
    return (sandbox as any).require.s.contexts._.config as MagentoRequireConfig;
}
