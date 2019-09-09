import yargs from 'yargs';
import { findMagentoRoot } from '../magentoFS';
import { trace, enableTracing } from '../trace';
import { build } from './build';
import { graph } from './graph';
import { BalerError } from '../BalerError';
import chalk from 'chalk';

export async function initializeCLI(cwd: string) {
    trace('initializeCLI');
    const cli = yargs.scriptName('baler').usage('$0 <cmd> [args]');
    const magentoRoot = await findMagentoRoot(cwd);
    if (!magentoRoot) {
        console.error(
            chalk.red(`Could not find Magento store root from "${cwd}"`),
        );
        process.exit(1);
        // TypeScript doesn't understand that `process.exit` halts execution,
        // so this throw that is otherwise dead code is here for a compiler hint
        throw void 0;
    }

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
        v => failOnReject(build)(magentoRoot, v.theme),
    );

    cli.command(
        'graph [theme]',
        'Generate a dotviz graph for all AMD module dependencies in a theme',
        y =>
            y
                .positional('theme', {
                    type: 'string',
                })
                .required('theme'),
        v => failOnReject(graph)(magentoRoot, v.theme),
    );

    const { argv } = cli;
    if (argv.trace) enableTracing();
    if (!argv._[0]) {
        // default command when none is specified
        failOnReject(build)(magentoRoot);
    }
}

function failOnReject<T extends Function>(fn: T): T {
    return function failOnRejectWrapper(...args: any[]) {
        const promise = fn(...args);

        promise.catch((err: Error | BalerError) => {
            if ('isBalerError' in err) {
                // Don't need the ugly stack trace for the known
                // category of failures
                console.error(`\n\n${chalk.red(err.message)}`);
            } else {
                console.error(`\n\n${err.stack}`);
            }
            process.exit(1);
        });

        return promise;
    } as any;
}
