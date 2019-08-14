import jsesc from 'jsesc';
import MagicString from 'magic-string';

// Tip: Can verify source-mappings are working correctly
// using http://evanw.github.io/source-map-visualization/

const RE_DEFINE = /define\s*\(/;

/**
 * @summary Wrap a text module (commonly .html) in an AMD module,
 *          escaping any code that would break out of the string
 *          boundaries
 */
export function wrapTextModule(id: string, source: string) {
    const [before, after] = `define('text!${id}', function() {
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
export function wrapShimmedModule(
    id: string,
    source: string,
    shimConfig: { [key: string]: RequireShim | string[] },
) {
    const shim = shimConfig[id];
    const deps = Array.isArray(shim) ? shim : shim.deps || [];
    const exports = Array.isArray(shim) ? undefined : shim.exports;
    const [before, after] = `define('${id}', ${JSON.stringify(
        deps,
    )}, function() {
        // Shimmed by bundlegento
        (function() {
            SPLIT;
        })();
        return window['${exports}'];
    });`.split('SPLIT');

    return new MagicString(source).prepend(before).append(after);
}

/**
 * @summary Add the provided id as the first argument to a `define` call
 */
export function renameModule(id: string, source: string) {
    const str = new MagicString(source);
    const { 0: match, index } = source.match(RE_DEFINE) || [];
    if (typeof index !== 'number') {
        throw new Error(
            'Failed RE_DEFINE RegExp. Should have used a real parser',
        );
    }

    return str.prependRight(index + match.length, `'${id}', `);
}
