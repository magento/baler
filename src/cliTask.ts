import ora from 'ora';
import chalk from 'chalk';
import prettyMS from 'pretty-ms';
import { performance } from 'perf_hooks';

const noop = () => {};

/**
 * @summary When running in CLI mode, will
 *          show individual line-items
 *          for tasks and whether they're
 *          completed or in-progress
 */
export function cliTask(startMessage: string, themeID?: string) {
    if (!(global as any).BALER_CLI_MODE) {
        // If someone is using baler programatically,
        // they won't want our CLI noise
        return noop;
    }

    const startTime = performance.now();
    const spinner = ora(wrapWithTheme(startMessage, themeID)).start();

    return function endCLITask(endMessage: string) {
        const endTime = performance.now();
        const time = chalk.grey(prettyMS(endTime - startTime));
        const msg = wrapWithTheme(endMessage, themeID);
        spinner.succeed(`${msg} ${time}`);
    };
}

const wrapWithTheme = (msg: string, themeID?: string) =>
    themeID ? `(${themeID}) ${msg}` : msg;
