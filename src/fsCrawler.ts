import { promises as fs } from 'fs';
import { join } from 'path';
import glob from 'fast-glob';

export async function fsCrawler(magentoRoot: string) {
    const composerDirs = await composerComponentPaths(magentoRoot);
    const appDirs = 'app/{code,design}/**/*.{phtml,html}';
    const vendorDirs = `vendor/{${composerDirs.join(',')}}/**/*.{phtml,html}`;

    return glob([appDirs, vendorDirs], {
        cwd: magentoRoot,
    });
}

/**
 * @summary Get a list of all composer dirs that are Magento modules or themes
 */
async function composerComponentPaths(magentoRoot: string) {
    const lockfilePath = join(magentoRoot, 'composer.lock');
    const rawLockfile = await fs.readFile(lockfilePath, 'utf8').catch(() => '');
    if (!rawLockfile) {
        // Should possibly just be a warning, but does anyone _not_ use composer with m2?
        throw new Error('Could not find "composer.lock" in Magento root');
    }

    const lockfile = JSON.parse(rawLockfile);
    const paths = [];

    for (const { type, name } of lockfile.packages) {
        if (type === 'magento2-module' || type === 'magento2-theme') {
            paths.push(name);
        }
    }

    return paths;
}
