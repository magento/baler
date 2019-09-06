import { StoreData, Theme, MagentoRequireConfig } from './types';
import { join, dirname } from 'path';
import { createMinifier, Minifier } from './createMinifier';
import { getLocalesForDeployedTheme, getStaticDirForTheme } from './magentoFS';
import {
    getRequireConfigFromDir,
    generateBundleRequireConfig,
} from './requireConfig';
import { traceAMDDependencies } from './traceAMDDependencies';
import { computeDepsForBundle } from './computeDepsForBundle';
import { createBundleFromDeps } from './createBundleFromDeps';
import { writeFile, mkdir } from './fsPromises';
import { flatten } from './flatten';
import { cliTask } from './cliTask';
import { BalerError } from './BalerError';

const BALER_META_DIR = 'balerbundles';

/**
 * @summary Optimize all eligible themes in a Magento 2 store
 */
export async function optimizeThemes(
    magentoRoot: string,
    store: StoreData,
    themesToOptimize: string[],
) {
    // Spins up a worker pool, so we only want to do it once, not per-theme
    const minifier = createMinifier();

    const pendingThemeResults = themesToOptimize.map(async themeID => {
        const theme = getThemeByID(themeID, store.components.themes);
        throwOnDisallowedTheme(theme);

        try {
            const result = await optimizeTheme(
                magentoRoot,
                store,
                theme,
                minifier,
            );
            return { themeID, success: true, result };
        } catch (error) {
            return { themeID, success: false, error };
        }
    });

    const themeResults = await Promise.all(pendingThemeResults);
    minifier.destroy();

    return themeResults;
}

/**
 * @summary Optimize a single theme in a Magento 2 store
 */
async function optimizeTheme(
    magentoRoot: string,
    store: StoreData,
    theme: Theme,
    minifier: Minifier,
) {
    const coreBundleResults = await createCoreBundle(
        magentoRoot,
        theme,
        minifier,
    );
    // TODO: Build phtml dependency graph

    return coreBundleResults;
}

/**
 * @summary Creates and writes the core bundle file for a given theme
 */
async function createCoreBundle(
    magentoRoot: string,
    theme: Theme,
    minifier: Minifier,
) {
    const deployedLocales = await getLocalesForDeployedTheme(
        magentoRoot,
        theme,
    );

    const [firstLocale] = deployedLocales;
    const firstLocaleRoot = join(
        magentoRoot,
        getStaticDirForTheme(theme),
        firstLocale,
    );

    const { requireConfig, rawRequireConfig } = await getRequireConfigFromDir(
        firstLocaleRoot,
    );
    const entryPoints = getEntryPointsFromConfig(requireConfig, theme.themeID);

    const { graph, resolvedEntryIDs } = await traceAMDDependencies(
        entryPoints,
        requireConfig,
        firstLocaleRoot,
    );
    const coreBundleDeps = computeDepsForBundle(graph, resolvedEntryIDs);

    const endBundleTask = cliTask(`Create core bundle file`, theme.themeID);
    const { bundle, bundleFilename, map } = await createBundleFromDeps(
        'core-bundle',
        coreBundleDeps,
        firstLocaleRoot,
        requireConfig,
        theme.themeID,
    );
    endBundleTask(`Created core bundle file`);

    const newRequireConfig = generateBundleRequireConfig(
        rawRequireConfig,
        'core-bundle',
        coreBundleDeps,
    );

    const endMinifyTask = cliTask(
        `Minify core bundle and RequireJS config`,
        theme.themeID,
    );
    const [minifiedCoreBundle, minifiedRequireConfig] = await Promise.all([
        minifier.minifyFromString(bundle, bundleFilename, map),
        minifier.minifyFromString(
            newRequireConfig,
            'requirejs-bundle-config.js',
        ),
    ]);
    const coreBundleSizes = {
        beforeMin: Buffer.from(bundle).byteLength,
        afterMin: Buffer.from(minifiedCoreBundle.code).byteLength,
    };
    const requireConfigSizes = {
        beforeMin: Buffer.from(rawRequireConfig).byteLength,
        afterMin: Buffer.from(minifiedRequireConfig.code).byteLength,
    };
    endMinifyTask(`Minified core bundle and RequireJS`);

    const files = [
        {
            pathFromLocaleRoot: join(BALER_META_DIR, bundleFilename),
            source: minifiedCoreBundle.code,
        },
        {
            pathFromLocaleRoot: join(BALER_META_DIR, `${bundleFilename}.map`),
            source: minifiedCoreBundle.map,
        },
        {
            pathFromLocaleRoot: 'requirejs-bundle-config.js',
            source: minifiedRequireConfig.code,
        },
        {
            pathFromLocaleRoot: 'requirejs-bundle-config.js.map',
            source: minifiedRequireConfig.map,
        },
    ];

    await writeFilesToAllLocales(magentoRoot, theme, files, deployedLocales);

    return {
        baseLocale: firstLocale,
        entryPoints: resolvedEntryIDs,
        graph,
        coreBundleSizes,
        requireConfigSizes,
    };
}

async function writeFilesToAllLocales(
    magentoRoot: string,
    theme: Theme,
    files: { pathFromLocaleRoot: string; source: string }[],
    locales: string[],
) {
    const staticDir = getStaticDirForTheme(theme);

    const pendingWrites = flatten(
        files.map(file => {
            return locales.map(async locale => {
                const path = join(
                    magentoRoot,
                    staticDir,
                    locale,
                    file.pathFromLocaleRoot,
                );
                await writeFileWithMkDir(path, file.source);
            });
        }),
    );

    await Promise.all(pendingWrites);
}

async function writeFileWithMkDir(path: string, source: string) {
    const dir = dirname(path);
    await mkdir(dir, { recursive: true });
    await writeFile(path, source);
}

function getThemeByID(themeID: string, themes: Record<string, Theme>) {
    const theme = themes[themeID];
    if (!theme) {
        throw new BalerError(
            `Attempted to optimize "${themeID}", but it was ` +
                'not found in the store.',
        );
    }

    return theme;
}

function throwOnDisallowedTheme(theme: Theme) {
    if (theme.area !== 'frontend') {
        throw new BalerError(
            `Cannot optimize theme "${theme.themeID}" ` +
                'because only "frontend" themes are supported by baler',
        );
    }
    if (theme.themeID === 'Magento/blank') {
        // Only reason we're doing this check is because it's likely
        // a mistake 99.9% of the time if you try to bundle blank
        throw new BalerError(
            `Optimization of "Magento/blank" is not supported`,
        );
    }
}

function getEntryPointsFromConfig(
    requireConfig: MagentoRequireConfig,
    themeID: string,
) {
    const entries = requireConfig.deps;
    if (Array.isArray(entries) && entries.length) {
        return entries;
    }

    throw new BalerError(
        `Could not find any entry points ("deps") config in ` +
            `"requirejs-config.js" for theme "${themeID}"`,
    );
}
