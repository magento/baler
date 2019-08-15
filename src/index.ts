import { createBundleFromDeps } from './createBundleFromDeps';
import { computeDepsForBundle } from './computeDepsForBundle';
import { getThemeHierarchy } from './getThemeHierarchy';
import { join } from 'path';
import { log } from './log';
import { readFile, mkdir, writeFile } from './fsPromises';
import { Theme, StoreData, DeployedTheme, BundleResult } from './types';
import { traceAMDDependencies } from './traceAMDDependencies';
import { evaluate, generateBundleRequireConfig } from './requireConfig';
import prettyBytes from 'pretty-bytes';

/**
 * @summary Create bundles for multiple deployed themes in pub/static.
 */
export async function bundleThemes(
    magentoRoot: string,
    store: StoreData,
): Promise<BundleResult[]> {
    const { components, deployedThemes } = store;
    const { frontend } = deployedThemes;

    const themesToBundle = frontend.filter(t => t.themeID !== 'Magento/blank');

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
 * @summary Create bundles for a single theme
 */
async function bundleSingleTheme(
    magentoRoot: string,
    themeHierarchy: Theme[],
    deployedTheme: DeployedTheme,
    store: StoreData,
): Promise<BundleResult> {
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
    const rawRequireConfig = await readFile(requireConfigPath, 'utf8');
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
    const newRequireConfig = generateBundleRequireConfig(
        rawRequireConfig,
        'core-bundle',
        deps,
    );

    const bundleDir = join(firstLocaleRoot, 'balerbundles');
    await mkdir(bundleDir, { recursive: true });
    const bundlePath = join(bundleDir, bundle.bundleFilename);
    await Promise.all([
        writeFile(bundlePath, bundle.bundle),
        writeFile(join(bundleDir, bundle.sourcemapFilename), bundle.sourcemap),
        writeFile(
            join(firstLocaleRoot, 'requirejs-bundle-config.js'),
            newRequireConfig,
        ),
    ]);

    return {
        totalBundleBytes: Buffer.from(bundle.bundle).byteLength,
        bundleFilename: bundle.bundleFilename,
        bundlePath,
        themeID: deployedTheme.themeID,
        deps,
    };
}
