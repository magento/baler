/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

// TODO: Just switch callers to use Array#flat
// or Array#flatMap when an LTS version of node
// has a version of v8 with it
export function flatten<T>(array: T[][]): T[] {
    return Array.prototype.concat.apply([], array);
}
