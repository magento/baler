/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import jsesc from 'jsesc';
import MagicString from 'magic-string';
import { Shim } from './types';
import { BalerError } from './BalerError';

// Tip: Can verify source-mappings are working correctly
// using http://evanw.github.io/source-map-visualization/

/**
 * @summary Wrap a text module (commonly .html) in an AMD module,
 *          escaping any code that would break out of the string
 *          boundaries
 */
export function wrapTextModule(id: string, source: string) {
    const [before, after] = `define('${id}', function() {
    return 'SPLIT';
});`.split('SPLIT');

    const escaped = jsesc(source);
    const str = new MagicString(source);
    const startPiece = escaped.slice(0, source.length);

    return str
        .overwrite(0, source.length, startPiece)
        .append(escaped.slice(source.length))
        .append(after)
        .prepend(before);
}

/**
 * @summary Wrap a non-AMD module in code that will make it (mostly)
 *          AMD-compatible in the bundle.
 *
 *          Non-AMD modules typically expect that they're running in the
 *          top-most lexical scope. We inject a separate `define` to prevent
 *          the runtime RequireJS lib from fetching a module it thinks hasn't
 *          been loaded, but we keep the module code itself in the top-most scope
 */
export function wrapNonShimmedModule(id: string, source: string) {
    const str = new MagicString(source);
    return str.prepend(`define('${id}', function() {
    // baler-injected stub for non-AMD module (no shim config was found for this module)
});
// Original code for non-AMD module ${id}\n`);
}

/**
 * @summary Rewrite a non-AMD module as an AMD module, using the provided
 *          shim config dependencies and exports values
 */
export function wrapShimmedModule(id: string, source: string, shim: Shim) {
    const deps = shim.deps || [];
    const [before, after] = `define('${id}', ${JSON.stringify(
        deps,
    )}, function() {
        // Shimmed by @magento/baler
        (function() {
            SPLIT;
        })();
        return window['${shim.exports}'];
    });`.split('SPLIT');

    return new MagicString(source).prepend(before).append(after);
}

const RE_DEFINE = /define\s*\(/;
/**
 * @summary Add the provided id as the first argument to a `define` call
 */
export function renameModule(id: string, source: string) {
    const str = new MagicString(source);
    const { 0: match, index } = source.match(RE_DEFINE) || [];
    if (typeof index !== 'number') {
        throw new BalerError(
            'Failed RE_DEFINE RegExp. Should have used a real parser',
        );
    }

    return str.prependRight(index + match.length, `'${id}', `);
}

/**
 * @summary Determine if a module is an AMD module using the
 *          `define` function
 */
export function isAMDWithDefine(source: string) {
    return RE_DEFINE.test(source);
}

const RE_NAMED_AMD = /define\s*\(\s*['"]/;
/**
 * @summary Determine if a module is already a named AMD module.
 *          A named AMD module will have a string literal as the first
 *          argument passed
 */
export function isNamedAMD(source: string) {
    const match = RE_NAMED_AMD.exec(source);
    return !!match;
}
