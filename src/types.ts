/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

export type Theme = {
    vendor: string;
    name: string;
    themeID: string;
    area: 'frontend' | 'adminhtml';
    parentID?: string;
    path: string;
};

export type ParserResult = {
    deps: string[];
    incompleteAnalysis: boolean;
};

export type MagentoRequireConfig = RequireConfig & {
    config?: {
        mixins?: {
            [key: string]: Record<string, boolean>;
        };
    };
};

export type AMDGraph = Record<string, string[]>;

export type Components = {
    modules: Record<string, Module>;
    themes: Record<string, Theme>;
};

export type Module = {
    moduleID: string;
    path: string;
};

export type StoreData = {
    enabledModules: string[];
    components: Components;
    deployedThemes: string[];
};

export type UnreadableDependencyWarning = {
    type: 'UnreadableDependencyWarning';
    resolvedID: string;
    path: string;
    issuer: string;
};

export type TraceResult = {
    graph: AMDGraph;
    resolvedEntryIDs: string[];
    warnings: UnreadableDependencyWarning[];
};

export type Shim = Omit<RequireShim, 'init'>;

export type ComponentPaths = {
    themes: Record<string, string>;
    modules: Record<string, string>;
};
