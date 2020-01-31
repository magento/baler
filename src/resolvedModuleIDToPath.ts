/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { join } from 'path';
import { extname } from 'path';

export function resolvedModuleIDToPath(request: string, baseDir: string) {
    const ext = extname(request);
    const fullPath = join(baseDir, request);

    return `${fullPath}${ext === '.html' || ext === '.js' ? '' : '.js'}`;
}
