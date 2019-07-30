import { fsCrawler } from './fsCrawler';
import { join } from 'path';
import { promises as fs } from 'fs';
import { parseTemplateDeps } from './parseTemplateDeps';

export async function analyze(magentoRoot: string) {
    if (!(await isMagentoRoot(magentoRoot))) {
        throw new Error(
            'Must be run from the root of a Magento 2 installation',
        );
    }

    const files = await fsCrawler(magentoRoot);
    const parseResults = await Promise.all(
        files.map(async file => {
            const path = join(magentoRoot, file);
            const contents = await fs.readFile(path, 'utf8');
            const results = parseTemplateDeps(contents);

            return [file, results] as [string, typeof results];
        }),
    );

    const dependencies: Record<string, string[]> = {};
    const incompleteAnalysis = [];

    for (const [file, result] of parseResults) {
        if (result.deps.length) {
            dependencies[file] = result.deps;
        }

        if (result.incompleteAnalysis) {
            incompleteAnalysis.push(file);
        }
    }

    console.log(JSON.stringify({ dependencies, incompleteAnalysis }, null, 2));
}

/**
 * @summary Hacky but functional validation that a directory is the
 *          root of a Magento 2 installation
 */
async function isMagentoRoot(magentoRoot: string) {
    const EXPECTED_ENTRIES = ['app', 'vendor', 'index.php', 'lib'];
    const entries = await fs.readdir(magentoRoot);
    return EXPECTED_ENTRIES.every(e => entries.includes(e));
}
