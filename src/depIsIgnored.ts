/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { REQUIRE_BUILT_INS } from './requireBuiltIns';
import { EXCLUDED_FILES } from './excludedFiles';

/**
 * @summary Will return true or false whether the dependency is
 *          ignored in REQUIRE_BUILT_INS or EXCLUDED_FILES.
 */
export function depIsIgnored(dep: string): boolean {
    return REQUIRE_BUILT_INS.includes(dep) || EXCLUDED_FILES.includes(dep);
}
