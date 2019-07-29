import glob from 'glob';
import { promises as fs } from 'fs';
import { promisify } from 'util';

export async function fsCrawler(magentoRoot: string) {
    if (!(await isMagentoRoot(magentoRoot))) {
        throw new Error(
            'Must be run from the root of a Magento 2 installation',
        );
    }

    const appDir = 'app/{code,design}/**/*.{phtml,html}';
    const vendor = 'vendor/**/*.{phtml,html}';

    const files = await promisify(glob)(appDir, {
        cwd: magentoRoot,
    });

    return files;
}

async function isMagentoRoot(magentoRoot: string) {
    const EXPECTED_ENTRIES = ['app', 'vendor', 'index.php', 'lib'];
    const entries = await fs.readdir(magentoRoot);
    return EXPECTED_ENTRIES.every(e => entries.includes(e));
}
