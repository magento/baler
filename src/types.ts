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

export type MagentoRequireConfig = RequireConfig & {
    config: {
        mixins: {
            [key: string]: Record<string, boolean>;
        };
    };
};
