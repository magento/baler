/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { trace } from './trace';
/**
 * @summary Separate a RequireJS module ID from associated plugin
 */
export function parseModuleID(request: string) {
    const parts = request.split('!');
    if (parts.length === 1) {
        return { id: parts[0], plugin: '' };
    }

    const [plugin, id, ...others] = parts;

    if (plugin === 'text') {
        if (others.length) {
            trace(
                `Too many values passed to "text" plugin for request "${request}"`,
            );
        }
        return { id, plugin: 'text' };
    }

    if (plugin === 'domReady') {
        if (others.length) {
            trace(
                `Too many values passed to "domReady" plugin for request "${request}"`,
            );
        }
        return { id, plugin: 'domReady' };
    }

    trace(
        `Unrecognized plugin "${plugin}" for request "${request}". This file will be skipped`,
    );

    return { id: '', plugin: '' };
}
