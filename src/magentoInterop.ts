import execa from 'execa';
import { ComponentPaths } from './types';

// Note: Loading the very minimal amount of code on the PHP side
// so that we don't hit the performance bottleneck of bootstrapping
// the entire Magento application. Thanks Vinai!
const phpSource = `
    require 'vendor/autoload.php';
    echo json_encode([
        "themes" => (new \\Magento\\Framework\\Component\\ComponentRegistrar)->getPaths('theme'),
        "modules" => (new \\Magento\\Framework\\Component\\ComponentRegistrar)->getPaths('module')
    ]);
`;

const PHP_BIN = process.env.BALER_PHP_PATH || 'php';

/**
 * @summary Invokes the PHP binary and extracts info about modules
 *          and themes from a store
 */
export async function getModulesAndThemesFromMagento(
    magentoRoot: string,
): Promise<ComponentPaths> {
    try {
        const { stdout } = await execa(PHP_BIN, [`-r`, phpSource], {
            cwd: magentoRoot,
        });
        return JSON.parse(stdout) as ComponentPaths;
    } catch (err) {
        throw new Error(
            'Unable to extract list of modules/theme from Magento.\n\n' +
                'Common causes:\n' +
                '  - "php" binary not available on $PATH. The path to the PHP binary can ' +
                'be specified using the $BALER_PHP_PATH environment variable\n' +
                '  - Broken Magento installation. You can test that things are working ' +
                'by running "bin/magento module:status"',
        );
    }
}
