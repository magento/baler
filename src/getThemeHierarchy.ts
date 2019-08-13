import { Theme } from './types';

/**
 * @summary Recursively resolve the inheritance hierarchy for a given theme.
 *          Results are ordered starting from the base theme
 */
export function getThemeHierarchy(
    theme: Theme,
    themes: Record<string, Theme>,
    deps?: Theme[],
): Theme[] {
    const dependencies = deps || [theme];
    if (!theme.parentID) return dependencies;

    const parent = Object.values(themes).find(
        t => t.themeID === theme.parentID,
    );
    if (!parent) {
        throw new Error(
            `Theme "${theme.themeID}" specified a parent (in theme.xml) of ` +
                `"${theme.parentID}", but that theme could not be found.`,
        );
    }

    dependencies.unshift(parent);
    return getThemeHierarchy(parent, themes, dependencies);
}
