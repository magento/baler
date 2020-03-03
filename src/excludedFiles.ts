/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const EXCLUDED_FILES: ReadonlyArray<string> = [
    // TODO: translation files are excluded as a work-around
    // for a bug. Implementing the "thorough" solution from
    // the following issue will speed up storefronts
    // https://github.com/magento/baler/issues/47#issuecomment-582580154
    'text!js-translation.json',
];

export { EXCLUDED_FILES };
