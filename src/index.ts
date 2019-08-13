import { getPHTMLFilesEligibleForUseWithTheme } from './magentoFS';
import { bundleFromGraph } from './bundleFromGraph';
import { getThemeHierarchy } from './getThemeHierarchy';
import { join } from 'path';
import { log } from './log';
import { promises as fs } from 'fs';
import { parseTemplateDeps } from './parseTemplateDeps';
import { Theme, StoreData, Module, DeployedTheme } from './types';
import fromentries from 'fromentries';
import { generateDotGraph } from './generateDotGraph';
import { traceAMDDependencies } from './traceAMDDependencies';
import { evaluate } from './requireConfig';
import { flatten } from './flatten';

/**
 * @summary Create bundles for multiple deployed themes in pub/static.
 */
export async function bundleThemes(magentoRoot: string, store: StoreData) {
    const { components, deployedThemes } = store;
    const { frontend, adminhtml } = deployedThemes;

    // const themesToBundle = [
    //     ...frontend.filter(t => t.themeID !== 'Magento/blank'),
    //     ...adminhtml,
    // ];
    const themesToBundle = frontend.filter(t => t.themeID === 'Magento/luma');

    const traceResults = await Promise.all(
        themesToBundle.map(t => {
            const theme = components.themes[t.themeID];
            const themeHierarchy = getThemeHierarchy(theme, components.themes);
            return computeThemeBundle(
                magentoRoot,
                themeHierarchy,
                t,
                store.enabledModules,
                store.components.modules,
            );
        }),
    );

    const bundlingResultsByTheme = await Promise.all(
        traceResults.map(async traceResult => {
            const result = await bundleFromGraph(
                magentoRoot,
                traceResult.graph,
                traceResult.resolvedEntryIDs,
            );
            return result;
        }),
    );

    return bundlingResultsByTheme;
}

/**
 * @summary Collect all graph data necessary to bundle a single theme
 *          for a single area (frontend/adminhtml)
 */
async function computeThemeBundle(
    magentoRoot: string,
    themeHierarchy: Theme[],
    deployedTheme: DeployedTheme,
    enabledModules: string[],
    modules: Record<string, Module>,
) {
    // Note: All work only needs to be done against a single theme, and then
    // copied to each locale. JS should not change between locales
    const [firstLocale] = deployedTheme.locales;
    log.debug(
        `Begin bundling theme "${deployedTheme.vendor}/${deployedTheme.name}", using locale "${firstLocale}" as the source`,
    );
    const firstLocaleRoot = join(deployedTheme.pathFromStoreRoot, firstLocale);
    const requireConfigPath = join(
        magentoRoot,
        firstLocaleRoot,
        'requirejs-config.js',
    );
    log.debug(`Reading "requirejs-config.js" from ${requireConfigPath}`);
    const rawRequireConfig = await fs.readFile(requireConfigPath, 'utf8');
    const requireConfig = evaluate(rawRequireConfig);
    const configEntryPoints = requireConfig.deps;

    if (!Array.isArray(configEntryPoints)) {
        throw new Error(
            `Could not find entry point(s) using "deps" in "requirejs-config.js" for theme ${deployedTheme.vendor}/${deployedTheme.name}`,
        );
    }

    // const templatePaths = await getPHTMLFilesEligibleForUseWithTheme(
    //     magentoRoot,
    //     themeHierarchy,
    //     enabledModules,
    //     modules,
    // );
    // const templatesWithDeps = await parsePHTMLTemplates(
    //     magentoRoot,
    //     templatePaths,
    // );
    // // Cast to a Set to eliminate dupes found between various templates
    // const allTemplateDeps = new Set(flatten(Object.values(templatesWithDeps)));

    return traceAMDDependencies(
        [...configEntryPoints /*, ...allTemplateDeps*/],
        requireConfig,
        firstLocaleRoot,
    );
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
            return [file, results.deps] as [string, string[]];
        }),
    );

    const templatesWithDeps = results.filter(([, result]) => result.length);
    return fromentries(templatesWithDeps);
}
