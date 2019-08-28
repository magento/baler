import { readFile, readdir, access } from './fsPromises';
import { join, parse } from 'path';
import glob from 'fast-glob';
import { flatten } from './flatten';
import { Theme, Components, Module } from './types';
import fromEntries from 'fromentries';
import { parse as parseXML } from 'fast-xml-parser';
import { findUp } from './findUp';
import { parseThemeIDFromRegistration } from './parseThemeIDFromRegistration';

/**
 * @summary Hacky but functional validation that a directory is the
 *          root of a Magento 2 installation
 */
export async function findMagentoRoot(dir: string) {
    const EXPECTED_ENTRIES = ['app', 'vendor', 'index.php', 'lib'];
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
    const configPath = join(magentoRoot, 'app/etc/config.php');
    const rawConfig = await readFile(configPath, 'utf8').catch(() => '');
    if (!rawConfig) {
        throw new Error(
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

    return enabledModules;
}

/**
 * @summary Finds all Magento components (modules/themes) in
 * both app/code and vendor
 */
export async function getComponents(root: string): Promise<Components> {
    const [composer, nonComposer] = await Promise.all([
        getComposerComponents(root),
        getNonComposerComponents(root),
    ]);

    const allModules = [...composer.modules, ...nonComposer.modules];
    const allThemes = [...composer.themes, ...nonComposer.themes];

    const modulesByName = fromEntries(allModules.map(m => [m.moduleID, m]));
    const themesByID = fromEntries(
        allThemes.map(theme => {
            return [theme.themeID, theme];
        }),
    );

    return {
        modules: modulesByName,
        themes: themesByID,
    };
}

/**
 * @summary Get a list of all _deployed_ frontend and adminhtml themes
 *          for all vendors
 */
export async function getDeployedThemes(
    magentoRoot: string,
): Promise<string[]> {
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

    return [...flatten(frontendThemes), ...flatten(adminThemes)];
}

/**
 * @summary Get an unordered list of all .phtml files for a specific
 *          area (frontend/adminhtml/base) for enabled modules only
 * @todo Switch from fast-glob to manual recursive crawling of the fs.
 *       Globbing has too much of a perf penalty
 */
export async function getPHTMLFilesEligibleForUseWithTheme(
    magentoRoot: string,
    themeHierarchy: Theme[],
    enabledModules: string[],
    modules: Record<string, Module>,
): Promise<string[]> {
    const moduleGlobs = enabledModules.map(moduleID => {
        const mod = modules[moduleID];
        return join(
            mod.pathFromStoreRoot,
            'view',
            `{${themeHierarchy[0].area},base}`,
            'templates',
            '**/*.phtml',
        );
    });

    const themeGlobs = flatten(
        enabledModules.map(m => {
            return themeHierarchy.map(
                t => `${t.pathFromStoreRoot}/${m}/templates/**/*.phtml`,
            );
        }),
    );

    return glob([...moduleGlobs, ...themeGlobs], {
        cwd: magentoRoot,
        onlyFiles: true,
    });
}

export async function getLocalesForDeployedTheme(
    magentoRoot: string,
    theme: Theme,
): Promise<string[]> {
    const themeRoot = join(magentoRoot, getStaticDirForTheme(theme));
    const dirs = await getDirEntriesAtPath(themeRoot);

    // filter out any extra files/folders that aren't locales
    const reLang = /^[a-z]{2}(?:_[a-z]{2})?$/i;
    return dirs.filter(d => reLang.test(d));
}

export function getStaticDirForTheme(theme: Theme) {
    // Can't use `vendor` prop from Theme, because the casing
    // might be different. Magento always uses the theme ID when
    // writing to `pub/static`. We have to split here, though,
    // so that *nix path separators don't make it in (need windows compat)
    const [vendor, name] = theme.themeID.split('/');
    return join('pub', 'static', theme.area, vendor, name);
}

async function getNonComposerComponents(root: string) {
    const [modules, themes] = await Promise.all([
        getNonComposerModules(root),
        getNonComposerThemes(root),
    ]);
    return { modules, themes };
}

async function getNonComposerModules(root: string) {
    const codeVendorsDir = join(root, 'app', 'code');
    const vendors = await getDirEntriesAtPath(codeVendorsDir);
    if (!vendors.length) return [];

    const modules = await Promise.all(
        vendors.map(async vendor => {
            const moduleNames = await getDirEntriesAtPath(
                join(codeVendorsDir, vendor),
            );
            return Promise.all(
                moduleNames.map(mod =>
                    getModuleConfig(root, join('app', 'code', vendor, mod)),
                ),
            );
        }),
    );

    return flatten(modules);
}

/**
 * @summary Read and parse select bits of data from a module's "module.xml"
 */
async function getModuleConfig(root: string, path: string): Promise<Module> {
    const realModuleRoot = await findRealModuleRoot(root, path);
    const configPath = join(root, realModuleRoot, 'etc', 'module.xml');
    const rawConfig = await readFile(configPath, 'utf8');
    const parsedConfig = parseXML(rawConfig, {
        ignoreAttributes: false,
        attributeNamePrefix: '',
        ignoreNameSpace: true,
    });

    return {
        moduleID: parsedConfig.config.module.name as string,
        pathFromStoreRoot: realModuleRoot,
    };
}

/**
 * @summary It's possible for the sources of data we care about in
 *          a module (etc dir, view dir, etc) to not be in the root
 *          of the package. The "real" root we need is in Magento
 *          inside registration.php, but it's not safe to try and parse
 *          that out. Instead, we'll try to find `module.xml` by
 *          scanning, since one level up from that will always
 *          be the real root we care about
 */
async function findRealModuleRoot(magentoRoot: string, path: string) {
    const typicalPath = join(path, 'etc', 'module.xml');
    try {
        // Fast path: check the typical location first to avoid a dir scan
        await access(join(magentoRoot, typicalPath));
        return path;
    } catch {}

    const matches = await glob('**/etc/module.xml', {
        cwd: join(magentoRoot, path),
    });

    if (!matches.length) {
        throw new Error(
            `Unable to locate "module.xml" for the module at path "${path}"`,
        );
    }

    if (matches.length > 1) {
        throw new Error(
            `Found > 1 "module.xml" for the module at path "${path}"`,
        );
    }

    return join(path, matches[0], '../..');
}

/**
 * @summary Get a collection of all themes in app/design
 */
async function getNonComposerThemes(root: string) {
    const [frontendVendors, adminVendors] = await Promise.all([
        getDirEntriesAtPath(join(root, 'app', 'design', 'frontend')),
        getDirEntriesAtPath(join(root, 'app', 'design', 'adminhtml')),
    ]);

    const pendingFrontend = frontendVendors.map(vendor =>
        getNonComposerThemesFromVendorInArea(root, vendor, 'frontend'),
    );
    const pendingAdmin = adminVendors.map(vendor =>
        getNonComposerThemesFromVendorInArea(root, vendor, 'adminhtml'),
    );

    const frontendThemes = flatten(await Promise.all(pendingFrontend));
    const adminThemes = flatten(await Promise.all(pendingAdmin));

    return [...frontendThemes, ...adminThemes];
}

/**
 * @summary Get a collection of all themes for a single vendor
 *          in a single area (frontend/adminhtml)
 */
async function getNonComposerThemesFromVendorInArea(
    root: string,
    vendor: string,
    area: Theme['area'],
): Promise<Theme[]> {
    const vendorPath = join('app', 'design', area, vendor);
    const themes = await getDirEntriesAtPath(join(root, vendorPath));
    return Promise.all(
        themes.map(async name => ({
            name,
            vendor,
            themeID: `${vendor}/${name}`,
            area,
            parentID: await getThemeParentName(join(root, vendorPath, name)),
            pathFromStoreRoot: join('app', 'design', area, vendor, name),
        })),
    );
}

type ComposerLock = {
    packages: {
        name: string;
        type:
            | 'magento2-module'
            | 'magento2-theme'
            | 'metapackage'
            | 'magento2-language';
    }[];
};

/**
 * @summary Get a collection of all themes and (Magento) modules
 *          installed with composer, using `composer.lock` as a
 *          source of data
 */
async function getComposerComponents(magentoRoot: string) {
    const lockfile = await readFile(
        join(magentoRoot, 'composer.lock'),
        'utf8',
    ).catch(() => '');
    // Composer lock file isn't a requirement if you're
    // not using composer
    if (!lockfile) {
        return { modules: [], themes: [] };
    }

    // We're relying on the composer lock file because it's
    // significantly faster than crawling each dependency dir
    const composerLock = JSON.parse(lockfile) as ComposerLock;
    const pendingModules: Promise<Module>[] = [];
    const pendingThemes: Promise<Theme>[] = [];

    for (const { name, type } of composerLock.packages) {
        if (type === 'magento2-module') {
            const modulePath = join('vendor', name);
            pendingModules.push(getModuleConfig(magentoRoot, modulePath));
        }

        if (type === 'magento2-theme') {
            pendingThemes.push(
                getThemeFromComposerPkg(join(magentoRoot, 'vendor', name)),
            );
        }
    }

    return {
        modules: await Promise.all(pendingModules),
        themes: await Promise.all(pendingThemes),
    };
}

/**
 * @summary Get theme details for a single theme installed with composer
 */
async function getThemeFromComposerPkg(pkgRoot: string): Promise<Theme> {
    const {
        rawRegistration,
        registrationPHPPath,
    } = await getRegistrationPHPForComposerPkg(pkgRoot);

    const themeData = parseThemeIDFromRegistration(
        rawRegistration,
        registrationPHPPath,
    );

    if (!themeData) {
        throw new Error(
            "Could not determine a theme's ID by analyzing " +
                `"${registrationPHPPath}". Baler uses static analysis ` +
                'to partially evaluate PHP, but it is not perfect. Please ' +
                'file a new issue on Github',
        );
    }

    const [vendor, name] = themeData.themeID.split('/');

    return {
        name,
        vendor,
        themeID: themeData.themeID,
        area: themeData.area,
        parentID: await getThemeParentName(pkgRoot),
        pathFromStoreRoot: pkgRoot,
    };
}

type ComposerJSON = {
    autoload?: {
        files?: string[];
    };
};

/**
 * @summary Attempts to find and read a theme's `registration.php`
 *          by inspecting autoload files in `composer.json`
 */
async function getRegistrationPHPForComposerPkg(pkgRoot: string) {
    const composerJSON = JSON.parse(
        await readFile(join(pkgRoot, 'composer.json'), 'utf8'),
    ) as ComposerJSON;

    const autoload =
        (composerJSON.autoload && composerJSON.autoload.files) || [];
    const possibleRegistrationFiles = autoload.filter(
        file => parse(file).base === 'registration.php',
    );

    if (possibleRegistrationFiles.length > 1) {
        throw new Error(
            'Unable to determine path to "registration.php" for ' +
                `the theme at "${pkgRoot}", because results were ambiguous`,
        );
    }

    if (!possibleRegistrationFiles.length) {
        throw new Error(
            'Unable to find "registration.php" for the theme at ' +
                `"${pkgRoot}". Make sure the theme's registration is in ` +
                'the autoload section of the package\'s "composer.json" ',
        );
    }

    const registrationPHPPath = join(pkgRoot, possibleRegistrationFiles[0]);
    const rawRegistration = await readFile(registrationPHPPath, 'utf8');

    return { rawRegistration, registrationPHPPath };
}

async function getThemeParentName(themePath: string) {
    const themeXMLPath = join(themePath, 'theme.xml');
    const source = await readFile(themeXMLPath, 'utf8').catch(() => '');
    if (!source) {
        throw new Error(
            `Could not find theme configuration (theme.xml) for theme at "${themeXMLPath}"`,
        );
    }

    const parsedThemeConfig = parseXML(source, {
        ignoreAttributes: false,
        attributeNamePrefix: '',
        ignoreNameSpace: true,
    });

    return (parsedThemeConfig.theme.parent as string) || '';
}

async function getDeployedThemesForVendor(
    magentoRoot: string,
    area: 'frontend' | 'adminhtml',
    vendor: string,
): Promise<string[]> {
    const vendorPath = join('pub', 'static', area, vendor);
    const vendorEntries = await getDirEntriesAtPath(
        join(magentoRoot, vendorPath),
    );
    const themeNames = vendorEntries.filter(e => /^[a-zA-Z0-9-_]+$/.test(e));

    return themeNames.map(name => `${vendor}/${name}`);
}

const getDirEntriesAtPath = (path: string) =>
    readdir(path, { withFileTypes: true })
        .then(entries => entries.filter(d => d.isDirectory()).map(d => d.name))
        .catch(() => [] as string[]);
