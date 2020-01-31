/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import terser, { MinifyOptions, SourceMapOptions } from 'terser';

type StringMinificationResult = {
    code: string;
    map: string;
};

// The RequireJS runtime, in some cases
// relies on Function.prototype.toString
// to find calls to `require`. These must
// be preserved
const mangleOptions = {
    reserved: ['require'],
};

/**
 * @summary Minifies JS code, optionally chaining from
 *          a provided source-map
 */
export async function minifyFromString(
    code: string,
    filename: string,
    map?: string,
): Promise<StringMinificationResult> {
    const opts: MinifyOptions = {
        sourceMap: {
            filename,
            url: `${filename}.map`,
        },
        mangle: mangleOptions,
    };

    if (map) {
        try {
            const parsedMap = JSON.parse(map) as SourceMapOptions['content'];
            // @ts-ignore
            opts.sourceMap.content = parsedMap;
        } catch {}
    }

    const result = terser.minify(code, opts);
    if (result.error) throw result.error;

    return { code: result.code as string, map: result.map as string };
}
