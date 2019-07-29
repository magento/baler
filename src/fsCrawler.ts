import glob from 'glob';
import { promises as fs } from 'fs';
import { promisify } from 'util';

export async function fsCrawler(magentoRoot: string) {
    const appDir = 'app/{code,design}/**/*.{phtml,html}';
    const vendor = 'vendor/**/*.{phtml,html}';

    const files = await promisify(glob)(appDir, {
        cwd: magentoRoot,
    });

    return files;
}
