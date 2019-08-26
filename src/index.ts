import { createBundleFromDeps } from './createBundleFromDeps';
import { computeDepsForBundle } from './computeDepsForBundle';
import { getThemeHierarchy } from './getThemeHierarchy';
import { getLocalesForDeployedTheme, getStaticDirForTheme } from './magentoFS';
import { join } from 'path';
import { log } from './log';
import { readFile, mkdir, writeFile } from './fsPromises';
import { Theme, StoreData, BundleResult } from './types';
import { traceAMDDependencies } from './traceAMDDependencies';
import { evaluate, generateBundleRequireConfig } from './requireConfig';
import { createMinifier } from './createMinifier';

/**
 * @summary Create bundles for multiple deployed themes in pub/static.
 */
export async function bundleThemes(
    magentoRoot: string,
    store: StoreData,
): Promise<BundleResult[]> {
    const { components, deployedThemes } = store;
    const minifier = createMinifier();

    const pendingBundleResults: ReturnType<typeof bundleSingleTheme>[] = [];
    for (const themeID of deployedThemes) {
        const theme = components.themes[themeID];
        if (theme.area !== 'frontend' || theme.themeID === 'Magento/blank') {
            continue;
        }

        const themeHierarchy = getThemeHierarchy(theme, components.themes);
        pendingBundleResults.push(
            bundleSingleTheme(
                magentoRoot,
                theme,
                themeHierarchy,
                store,
                minifier,
            ),
        );
    }

    const results = await Promise.all(pendingBundleResults);
    minifier.destroy();
    return results;
}

/**
 * @summary Create bundles for a single theme
 */
async function bundleSingleTheme(
    magentoRoot: string,
    theme: Theme,
    themeHierarchy: Theme[],
    store: StoreData,
    minifier: ReturnType<typeof createMinifier>,
): Promise<BundleResult> {
    const locales = await getLocalesForDeployedTheme(magentoRoot, theme);
    // Note: All work only needs to be done against a single theme, and then
    // copied to each locale. JS should not change between locales
    const [firstLocale] = locales;
    log.debug(
        `Begin bundling theme "${theme.themeID}", using locale "${firstLocale}" as the source`,
    );
    const firstLocaleRoot = join(getStaticDirForTheme(theme), firstLocale);
    const requireConfigPath = join(
        magentoRoot,
        firstLocaleRoot,
        'requirejs-config.js',
    );
    log.debug(`Reading "requirejs-config.js" from ${requireConfigPath}`);
    const rawRequireConfig = await readFile(requireConfigPath, 'utf8');
    const requireConfig = evaluate(rawRequireConfig);
    const configEntryPoints = requireConfig.deps;

    if (!Array.isArray(configEntryPoints)) {
        throw new Error(
            `Could not find entry point(s) using "deps" in "requirejs-config.js" for theme ${theme.themeID}`,
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
    const newRequireConfig = generateBundleRequireConfig(
        rawRequireConfig,
        'core-bundle',
        deps,
    );

    const bundleDir = join(firstLocaleRoot, 'balerbundles');
    await mkdir(bundleDir, { recursive: true });

    const minifiedBundle = await minifier.minifyFromString(
        bundle.bundle,
        bundle.bundleFilename,
        bundle.map,
    );
    const bundlePath = join(bundleDir, bundle.bundleFilename);
    const mapPath = join(bundleDir, `${bundle.bundleFilename}.map`);
    await Promise.all([
        writeFile(bundlePath, minifiedBundle.code),
        writeFile(mapPath, minifiedBundle.map),
        writeFile(
            join(firstLocaleRoot, 'requirejs-bundle-config.js'),
            newRequireConfig,
        ),
    ]);

    return {
        totalBundleBytes: Buffer.from(bundle.bundle).byteLength,
        bundleFilename: bundle.bundleFilename,
        bundlePath,
        themeID: theme.themeID,
        deps,
    };
}
