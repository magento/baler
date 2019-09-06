import { optimizeThemes } from './optimizeThemes';
import { collectStoreData } from './collectStoreData';
import { findMagentoRoot } from './magentoFS';
import { StoreData } from './types';
import { trace, enableTracing } from './trace';
import { BalerError } from './BalerError';
import yargs from 'yargs';
import chalk from 'chalk';

/**
 * @summary Execute the CLI from the specified working directory
 */
export function run(cwd: string) {
    trace('starting cli');
    const cli = yargs.scriptName('baler').usage('$0 <cmd> [args]');

    cli.command(
        'build [--theme Magento/luma]',
        'Optimize JavaScript assets for one or more themes',
        {
            theme: {
                requiresArg: true,
                array: true,
                type: 'string',
            },
        },
        v => failOnReject(buildCommand(cwd, v.theme)),
    );

    cli.command(
        'graph [theme]',
        'Generate a dotviz graph for all AMD module dependencies in a theme',
        y => {
            return y
                .positional('theme', {
                    type: 'string',
                })
                .required('theme');
        },
        v => failOnReject(graphCommand(cwd, v.theme)),
    );

    cli.option('trace', {
        description: 'Write trace results to a file in the current directory',
        type: 'boolean',
    });

    const { argv } = cli;
    if (argv.trace) enableTracing();
    if (!argv._[0]) failOnReject(buildCommand(cwd));
}

async function graphCommand(cwd: string, theme: string) {
    console.log('Not implemented yet');
}

async function buildCommand(cwd: string, themeIDs?: string[]) {
    trace('cli build command');
    const magentoRoot = await findMagentoRoot(cwd);
    if (!magentoRoot) {
        throw new BalerError(
            `Could not find a Magento 2 installation from ${cwd}`,
        );
    }

    const store = await collectStoreData(magentoRoot);
    const allAvailableThemes = getAllAvailableThemes(store);

    if (themeIDs && themeIDs.length) {
        const invalid = themeIDs.filter(t => !allAvailableThemes.includes(t));
        if (invalid.length) {
            throw new BalerError(
                `You specified ${themeIDs.length} theme(s) to optimize, ` +
                    `but ${invalid.length} of them is not optimizable ` +
                    `(${invalid.join(', ')}).\n\n` +
                    `For a theme to be optimizable, it must:\n` +
                    `  - Be for the "frontend" area\n` +
                    `  - Be deployed already with bin/magento setup:static-content:deploy\n`,
            );
        }
    }

    const results = await optimizeThemes(
        magentoRoot,
        store,
        themeIDs || allAvailableThemes,
    );
    console.log(
        '\nOptimization is done, but stats have not been implemented in the CLI yet',
    );
}

function getAllAvailableThemes(store: StoreData): string[] {
    const { components, deployedThemes } = store;

    return Object.values(components.themes)
        .filter(t => t.area === 'frontend' && t.themeID !== 'Magento/blank')
        .filter(t => deployedThemes.includes(t.themeID))
        .map(t => t.themeID);
}

function failOnReject<T>(promise: Promise<T>) {
    return promise.catch((err: Error | BalerError) => {
        if ('isBalerError' in err) {
            // Don't need the ugly stack trace for the known
            // category of failures
            console.error(`\n\n${chalk.red(err.message)}`);
        } else {
            console.error(`\n\n${err.stack}`);
        }

        process.exit(1);
    });
}
