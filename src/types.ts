export type Theme = {
    vendor: string;
    name: string;
    area: string;
    locales: string[];
    pathFromStoreRoot: string;
};

export type ParserResult = {
    deps: string[];
    incompleteAnalysis: boolean;
};

export type AMDDependency = Readonly<{
    type: 'AMDDependency';
    requireID: string;
}>;

export type PHTMLDependency = Readonly<{
    type: 'PHTMLDependency';
    pathFromStoreRoot: string;
}>;

export type Dependency = AMDDependency | PHTMLDependency;

export type MagentoRequireConfig = RequireConfig & {
    config: {
        mixins: {
            [key: string]: Record<string, boolean>;
        };
    };
};
