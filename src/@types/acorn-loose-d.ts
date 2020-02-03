/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

declare module 'acorn-loose' {
    function parse(
        input: string,
        options?: import('acorn').Options,
    ): import('acorn').Node;
    export { parse };
}
