/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { join, parse } from 'path';
import { readdir } from './fsPromises';

type FindUpPredicate = (dir: string, entries: string[]) => Boolean;
/**
 * @summary Walk up a directory tree looking for a matching dir
 */
export async function findUp(
    dir: string,
    predicate: FindUpPredicate,
): Promise<string | undefined> {
    try {
        const entries = await readdir(dir);
        const isMatch = predicate(dir, entries);
        if (isMatch) return dir;

        const oneUp = join(dir, '..');
        if (oneUp === parse(oneUp).root) return;

        return findUp(oneUp, predicate);
    } catch {
        return;
    }
}
