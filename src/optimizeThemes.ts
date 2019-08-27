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

const BALER_META_DIR = 'balerbundles';

/**
 * @summary Optimize all eligible themes in a Magento 2 store
 */
export async function optimizeThemes(
    magentoRoot: string,
    store: StoreData,
    themesToOptimize: string[],
) {
    const minifier = createMinifier();

    const pendingThemeResults = themesToOptimize.map(themeID => {
        const theme = getThemeByID(themeID, store.components.themes);
        throwOnDisallowedTheme(theme);

        return optimizeTheme(magentoRoot, store, theme, minifier);
    });

    // TODO: Promise.allSettled
    const results = await Promise.all(pendingThemeResults);
    minifier.destroy();
    return results;
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
    const firstLocaleRoot = join(getStaticDirForTheme(theme), firstLocale);

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
    const { bundle, bundleFilename, map } = await createBundleFromDeps(
        'core-bundle',
        coreBundleDeps,
        firstLocaleRoot,
        requireConfig,
    );
    const newRequireConfig = generateBundleRequireConfig(
        rawRequireConfig,
        'core-bundle',
        coreBundleDeps,
    );
    const [minifiedCoreBundle, minifiedRequireConfig] = await Promise.all([
        minifier.minifyFromString(bundle, bundleFilename, map),
        minifier.minifyFromString(
            newRequireConfig,
            'requirejs-bundle-config.js',
        ),
    ]);

    const files: WritableThemeFile[] = [
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

    const results = await writeFilesToAllLocales(
        magentoRoot,
        theme,
        files,
        deployedLocales,
    );
    const failedWrites = results.filter(r => !r.success).map(r => r.file);

    return {
        baseLocale: firstLocale,
        entryPoints: resolvedEntryIDs,
        graph,
        coreBundleBytesBeforeMin: Buffer.from(bundle).byteLength,
        coreBundleBytesAfterMin: Buffer.from(minifiedCoreBundle.code)
            .byteLength,
        requireConfigBytesBeforeMin: Buffer.from(rawRequireConfig).byteLength,
        requireConfigBytesAfterMin: Buffer.from(minifiedRequireConfig.code)
            .byteLength,
        failedWrites,
    };
}

type WritableThemeFile = {
    pathFromLocaleRoot: string;
    source: string;
};
async function writeFilesToAllLocales(
    magentoRoot: string,
    theme: Theme,
    files: WritableThemeFile[],
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
                try {
                    await writeFileWithMkDir(path, file.source);
                    return { success: true, file, locale };
                } catch {
                    return { success: false, file, locale };
                }
            });
        }),
    );

    const writeResults = await Promise.all(pendingWrites);
    return writeResults;
}

async function writeFileWithMkDir(path: string, source: string) {
    const dir = dirname(path);
    await mkdir(dir, { recursive: true });
    await writeFile(path, source);
}

function getThemeByID(themeID: string, themes: Record<string, Theme>) {
    const theme = themes[themeID];
    if (!theme) {
        throw new Error(
            `Attempted to optimize "${themeID}", but it was ` +
                'not found in the store.',
        );
    }

    return theme;
}

function throwOnDisallowedTheme(theme: Theme) {
    if (theme.area !== 'frontend') {
        throw new Error(
            `Cannot optimize theme "${theme.themeID}" ` +
                'because only "frontend" themes are supported by baler',
        );
    }
    if (theme.themeID === 'Magento/blank') {
        // Only reason we're doing this check is because it's likely
        // a mistake 99.9% of the time if you try to bundle blank
        throw new Error(`Optimization of "Magento/blank" is not supported`);
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

    throw new Error(
        `Could not find any entry points ("deps") config in ` +
            `"requirejs-config.js" for theme "${themeID}"`,
    );
}
