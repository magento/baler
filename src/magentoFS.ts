/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { readFile, readdir } from './fsPromises';
import { join } from 'path';
import glob from 'fast-glob';
import { flatten } from './flatten';
import { Theme, Components, Module, ComponentPaths } from './types';
import fromEntries from 'fromentries';
import { parse as parseXML } from 'fast-xml-parser';
import { findUp } from './findUp';
import { getModulesAndThemesFromMagento } from './magentoInterop';
import { BalerError } from './BalerError';
import { trace } from './trace';

/**
 * @summary Verify all the dirs we need from Magento are available.
 *          Things to be checked should be kept to the essentials
 *          (see: https://github.com/magento/baler/issues/30)
 */
export async function findMagentoRoot(dir: string) {
    trace(`looking for magento root starting at ${dir}`);
    const EXPECTED_ENTRIES = ['app', 'vendor', 'pub'];
    const predicate = (dir: string, entries: string[]) => {
        return EXPECTED_ENTRIES.every(e => entries.includes(e));
    };

    return findUp(dir, predicate);
}

/**
 * @summary Get a list of names for all enabled modules.
 *          We _could_ use a full PHP parser here to be safe,
 *          but `app/etc/config.php` is codegen'd, so the odds
 *          of it not following very specific conventions is small
 */
export async function getEnabledModules(magentoRoot: string) {
    trace('reading enabled modules from app/etc/config.php');
    const configPath = join(magentoRoot, 'app/etc/config.php');
    const rawConfig = await readFile(configPath, 'utf8').catch(() => '');
    if (!rawConfig) {
        throw new BalerError(
            `Failed to read list of enabled modules from ${configPath}`,
        );
    }

    const [, rawArrayBody = ''] =
        rawConfig.match(/'modules'\s*=>\s*\[(.+)\]/s) || [];
    const items = rawArrayBody.split(',').map(t => t.trim());

    const enabledModules: string[] = [];
    for (const item of items) {
        const [, name = '', enabledStr = ''] =
            item.match(/'(\w+)'\s*=>\s*([01])/) || [];
        if (name && Number(enabledStr)) enabledModules.push(name);
    }

    trace(`enabled modules: ${JSON.stringify(enabledModules)}`);
    return enabledModules;
}

export async function getComponents(magentoRoot: string): Promise<Components> {
    const componentPaths = await getModulesAndThemesFromMagento(magentoRoot);
    return {
        themes: await getThemesFromPaths(componentPaths.themes),
        modules: getModulesFromPaths(componentPaths.modules),
    };
}

async function getThemesFromPaths(
    themePaths: ComponentPaths['themes'],
): Promise<Record<string, Theme>> {
    const pendingThemes: Promise<[string, Theme]>[] = Object.entries(
        themePaths,
    ).map(async ([fullID, path]) => {
        const [area, vendor, name] = fullID.split('/');
        const themeID = `${vendor}/${name}`;
        const theme: Theme = {
            name,
            vendor,
            area: area as Theme['area'],
            themeID,
            path,
            parentID: await getThemeParentName(path),
        };
        return [themeID, theme] as [string, Theme];
    });
    return fromEntries(await Promise.all(pendingThemes));
}

function getModulesFromPaths(
    modulePaths: ComponentPaths['modules'],
): Record<string, Module> {
    return fromEntries(
        Object.entries(modulePaths).map(([moduleID, path]) => {
            const mod: Module = {
                moduleID,
                path: path,
            };
            return [moduleID, mod] as [string, Module];
        }),
    );
}

/**
 * @summary Get a list of all _deployed_ frontend and adminhtml themes
 *          for all vendors
 */
export async function getDeployedThemes(
    magentoRoot: string,
): Promise<string[]> {
    trace('checking pub/static for deployed themes');
    const staticRoot = join(magentoRoot, 'pub', 'static');

    const [frontendVendors, adminVendors] = await Promise.all([
        getDirEntriesAtPath(join(staticRoot, 'frontend')),
        getDirEntriesAtPath(join(staticRoot, 'adminhtml')),
    ]);

    const pendingFrontendThemes = Promise.all(
        frontendVendors.map(v =>
            getDeployedThemesForVendor(magentoRoot, 'frontend', v),
        ),
    );
    const pendingAdminThemes = Promise.all(
        adminVendors.map(v =>
            getDeployedThemesForVendor(magentoRoot, 'adminhtml', v),
        ),
    );

    const [frontendThemes, adminThemes] = await Promise.all([
        pendingFrontendThemes,
        pendingAdminThemes,
    ]);

    const deployedThemes = [
        ...flatten(frontendThemes),
        ...flatten(adminThemes),
    ];
    trace(`found deployed themes: ${deployedThemes}`);
    return deployedThemes;
}

/**
 * @summary Get an unordered list of all .phtml files for a specific
 *          area (frontend/adminhtml/base) for enabled modules only
 * @todo Switch from fast-glob to manual recursive crawling of the fs.
 *       Globbing has too much of a perf penalty
 */
export async function getPHTMLFilesEligibleForUseWithTheme(
    themeHierarchy: Theme[],
    enabledModules: string[],
    modules: Record<string, Module>,
): Promise<string[]> {
    const moduleGlobs = enabledModules.map(moduleID => {
        const mod = modules[moduleID];
        return join(
            mod.path,
            'view',
            `{${themeHierarchy[0].area},base}`,
            'templates',
            '**/*.phtml',
        );
    });

    const themeGlobs = flatten(
        enabledModules.map(m => {
            return themeHierarchy.map(
                t => `${t.path}/${m}/templates/**/*.phtml`,
            );
        }),
    );

    return glob([...moduleGlobs, ...themeGlobs], {
        onlyFiles: true,
    });
}

export async function getLocalesForDeployedTheme(
    magentoRoot: string,
    theme: Theme,
): Promise<string[]> {
    trace(`fetching deployed locales for ${theme.themeID}`);
    const themeRoot = join(magentoRoot, getStaticDirForTheme(theme));
    const dirs = await getDirEntriesAtPath(themeRoot);

    // filter out any extra files/folders that aren't locales
    const reLang = /^[a-z]{2}(?:_[a-z]{2})?$/i;
    const locales = dirs.filter(d => reLang.test(d));
    trace(
        `found deployed locales for ${theme.themeID}: ${JSON.stringify(
            locales,
        )}`,
    );
    return locales;
}

export function getStaticDirForTheme(theme: Theme) {
    // Can't use `vendor` prop from Theme, because the casing
    // might be different. Magento always uses the theme ID when
    // writing to `pub/static`. We have to split here, though,
    // so that *nix path separators don't make it in (need windows compat)
    const [vendor, name] = theme.themeID.split('/');
    return join('pub', 'static', theme.area, vendor, name);
}

async function getThemeParentName(themePath: string) {
    trace(`checking for parent of theme at ${themePath}`);
    const themeXMLPath = join(themePath, 'theme.xml');
    const source = await readFile(themeXMLPath, 'utf8').catch(() => '');
    if (!source) {
        throw new BalerError(
            `Could not find theme configuration (theme.xml) for theme at "${themeXMLPath}"`,
        );
    }

    const parsedThemeConfig = parseXML(source, {
        ignoreAttributes: false,
        attributeNamePrefix: '',
        ignoreNameSpace: true,
    });

    const parent = (parsedThemeConfig.theme.parent as string) || '';
    trace(
        parent
            ? `found parent of ${parent} for theme at ${themePath}`
            : `no parent found for theme at path ${themePath}`,
    );
    return parent;
}

async function getDeployedThemesForVendor(
    magentoRoot: string,
    area: 'frontend' | 'adminhtml',
    vendor: string,
): Promise<string[]> {
    const vendorPath = join(magentoRoot, 'pub', 'static', area, vendor);
    const vendorEntries = await getDirEntriesAtPath(vendorPath);
    const themeNames = vendorEntries.filter(e => /^[a-zA-Z0-9-_]+$/.test(e));

    return themeNames.map(name => `${vendor}/${name}`);
}

const getDirEntriesAtPath = (path: string) =>
    readdir(path, { withFileTypes: true })
        .then(entries => entries.filter(d => d.isDirectory()).map(d => d.name))
        .catch(() => [] as string[]);
