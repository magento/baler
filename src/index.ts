import { collectTemplates } from './magentoFS';
import { join } from 'path';
import { log } from './log';
import { promises as fs } from 'fs';
import { parseTemplateDeps } from './parseTemplateDeps';
import { Theme } from './types';
import fromentries from 'fromentries';
import { traceAMDDependencies } from './traceAMDDependencies';
import { evaluateRequireConfig } from './evaluateRequireConfig';

const BUNDLE_ENTRY = 'mage/bootstrap';

/**
 * @summary Create bundles for multiple deployed themes in pub/static.
 */
export async function bundleThemes(magentoRoot: string, themes: Theme[]) {
    const formattedThemesNames = themes
        .map(t => `  - ${t.vendor}/${t.name}`)
        .join('\n');
    log.info(`Preparing to bundle ${themes.length} themes:`);
    log.info(formattedThemesNames);
    // const templateFiles = await collectTemplates(magentoRoot);
    // const templates = await parsePHTMLTemplates(magentoRoot, templateFiles);
    const results = await Promise.all(
        themes.map(t => bundleTheme(magentoRoot, t)),
    );

    return results;
}

async function bundleTheme(magentoRoot: string, theme: Theme) {
    // Note: All work only needs to be done against a single theme, and then
    // copied to each locale. JS should not change between locales
    const [firstLocale] = theme.locales;
    log.debug(
        `Begin bundling theme "${theme.vendor}/${theme.name}", using locale "${firstLocale}" as the source`,
    );
    const firstLocaleRoot = join(theme.pathFromStoreRoot, firstLocale);
    const requireConfigPath = join(
        magentoRoot,
        firstLocaleRoot,
        'requirejs-config.js',
    );
    log.debug(`Reading "requirejs-config.js" from ${requireConfigPath}`);
    const rawRequireConfig = await fs.readFile(requireConfigPath, 'utf8');
    const requireConfig = evaluateRequireConfig(rawRequireConfig);
    const graph = await traceAMDDependencies(
        BUNDLE_ENTRY,
        requireConfig,
        firstLocaleRoot,
    );
    console.log(JSON.stringify(graph, null, 2));
}

async function parsePHTMLTemplates(
    magentoRoot: string,
    templatePaths: string[],
) {
    const results = await Promise.all(
        templatePaths.map(async file => {
            const path = join(magentoRoot, file);
            const contents = await fs.readFile(path, 'utf8');
            const results = parseTemplateDeps(contents);
            return [file, results] as [string, typeof results];
        }),
    );

    return fromentries(results);
}
