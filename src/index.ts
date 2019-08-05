import { collectTemplates } from './magentoFS';
import { join } from 'path';
import { promises as fs } from 'fs';
import { parseTemplateDeps } from './parseTemplateDeps';
import { Theme } from './types';

/**
 * @summary Create bundles for a single deployed theme in pub/static
 */
export async function bundleThemes(magentoRoot: string, themes: Theme[]) {
    const templateFiles = await collectTemplates(magentoRoot);
    console.log(templateFiles.length);
}

export async function analyze(magentoRoot: string) {
    const files = await collectTemplates(magentoRoot);
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
