/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { findMagentoRoot } from '../magentoFS';
import { trace, enableTracing } from '../trace';
import { build } from './build';
import { graph } from './graph';
import { BalerError } from '../BalerError';
import chalk from 'chalk';
import minimist from 'minimist';

export async function initializeCLI(argv: string[], cwd: string) {
    const args = minimist(argv.slice(2));
    const [command] = args._;

    if (args.help) {
        return console.log(helpMsg);
    }

    if (args.trace) enableTracing();
    trace('starting CLI');

    const magentoRoot = await findMagentoRoot(cwd);
    if (!magentoRoot) {
        errMsgAndExit(
            `Could not find required data from Magento store at "${cwd}". ` +
                'To bundle your themes, baler needs to run from a directory ' +
                'with access to the following locations:\n' +
                '- app/code\n' +
                '- app/etc/config.php\n' +
                '- pub/static' +
                '- vendor\n',
        );
        return;
    }

    if (command === 'build' || !command) {
        const themeIDs =
            args.theme &&
            (Array.isArray(args.theme) ? args.theme : [args.theme]);

        return await failOnReject(build)(magentoRoot, themeIDs);
    }

    if (command === 'graph') {
        const themeID = args.theme;
        if (!themeID) {
            errMsgAndExit('Must supply the ID of a theme with --theme.');
        }
        return await failOnReject(graph)(magentoRoot, themeID);
    }

    errMsgAndExit(`Unrecognized baler command: ${command}`);
}

function errMsgAndExit(message: string) {
    console.error(chalk.red(message));
    process.exit(1);
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

const helpMsg = chalk`Usage
  {green $ baler <command> [options]}

  {underline Commands}
    build --theme Vendor/name
    graph --theme Vendor/name

  {underline Examples}
    {gray Optimize all eligible themes}
    $ baler build

    {gray Optimize multiple themes}
    $ baler build --theme Magento/foo --theme Magento/bar

    {gray Generate Dependency Graph}
    $ baler graph --theme Magento/luma
`;
