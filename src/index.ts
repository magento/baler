import { getPHTMLFilesEligibleForUseWithTheme } from './magentoFS';
import { createBundleFromDeps } from './createBundleFromDeps';
import { computeDepsForBundle } from './computeDepsForBundle';
import { getThemeHierarchy } from './getThemeHierarchy';
import { join } from 'path';
import { log } from './log';
import { promises as fs } from 'fs';
import { parseTemplateDeps } from './parseTemplateDeps';
import { Theme, StoreData, Module, DeployedTheme } from './types';
import fromentries from 'fromentries';
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

    const bundleResults = await Promise.all(
        themesToBundle.map(t => {
            const theme = components.themes[t.themeID];
            const themeHierarchy = getThemeHierarchy(theme, components.themes);
            return bundleSingleTheme(magentoRoot, themeHierarchy, t, store);
        }),
    );

    return bundleResults;
}

/**
 * @summary Create bundles for a single theme (frontend or adminhtml)
 */
async function bundleSingleTheme(
    magentoRoot: string,
    themeHierarchy: Theme[],
    deployedTheme: DeployedTheme,
    store: StoreData,
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

    const traceResult = await traceAMDDependencies(
        configEntryPoints,
        requireConfig,
        firstLocaleRoot,
    );

    const deps = computeDepsForBundle(
        traceResult.graph,
        traceResult.resolvedEntryIDs,
    );
    const bundle = await createBundleFromDeps(
        'core-bundle',
        deps,
        firstLocaleRoot,
        requireConfig,
    );

    const bundleDir = join(firstLocaleRoot, 'balerbundles');
    await fs.mkdir(bundleDir, { recursive: true });
    await Promise.all([
        fs.writeFile(join(bundleDir, bundle.bundleFilename), bundle.bundle),
        fs.writeFile(
            join(bundleDir, bundle.sourcemapFilename),
            bundle.sourcemap,
        ),
    ]);

    // return bundle;
    // const templatePaths = await getPHTMLFilesEligibleForUseWithTheme(
    //     magentoRoot,
    //     themeHierarchy,
    //     store.enabledModules,
    //     store.modules,
    // );
    // const templatesWithDeps = await parsePHTMLTemplates(
    //     magentoRoot,
    //     templatePaths,
    // );
    // // Cast to a Set to eliminate dupes found between various templates
    // const allTemplateDeps = new Set(flatten(Object.values(templatesWithDeps)));
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
