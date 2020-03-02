/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { REQUIRE_BUILT_INS } from './requireBuiltIns';
import { IGNORED_TEXT_FILES } from './ignoredTextFiles';

/**
 * @summary Will return true or false whether the dependency is
 *          ignored in REQUIRE_BUILT_INS or IGNORED_TEXT_FILES.
 */
export function depIsIgnored(dep: string): boolean {
    return REQUIRE_BUILT_INS.includes(dep) || IGNORED_TEXT_FILES.includes(dep);
}
