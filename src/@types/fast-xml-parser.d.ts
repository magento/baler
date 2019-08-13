/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

declare module 'fast-xml-parser' {
    type Opts = {
        ignoreAttributes: boolean;
        attributeNamePrefix: string | boolean;
        ignoreNameSpace: boolean;
    };
    function parse(xml: string, opts?: Opts): any;
    export { parse };
}
