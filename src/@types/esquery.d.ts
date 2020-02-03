/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

declare module 'esquery' {
    function query(
        ast: import('estree').Program,
        query: string,
    ): import('estree').Node[];
    export { query };
}
