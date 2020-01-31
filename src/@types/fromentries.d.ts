/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

declare module 'fromentries' {
    function fromEntries<T>(
        entries: ArrayLike<[string, T]> | Iterable<[string, T]>,
    ): Record<string, T>;
    export = fromEntries;
}
