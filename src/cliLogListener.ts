import { onDebugEvent } from './debug';
import prettyBytes from 'pretty-bytes';
import prettyMS from 'pretty-ms';

export function initLogListener() {
    onDebugEvent(event => {
        switch (event.type) {
            case 'collectStoreData:start': {
                console.log(
                    'Collecting data about themes and modules from the store',
                );
                break;
            }
            case 'collectStoreData:end': {
                const { timing } = event;
                const total = timing.end - timing.start;

                console.log(`Data collection completed in ${prettyMS(total)}`);
                break;
            }
            case 'eligibleThemes': {
                const themeLines = event.payload.map(n => `  - ${n}`);
                const themeLabel = themeLines.length > 1 ? 'themes' : 'theme';
                console.log(
                    [
                        `Found ${event.payload.length} eligible ${themeLabel} to optimize\n`,
                        ...themeLines,
                    ].join(''),
                );
                break;
            }
            case 'createBundle:start': {
                const { bundleName, themeID, deps } = event;
                console.log(
                    `Starting to bundle ${bundleName} for ${themeID} with ${deps.length} dependencies`,
                );
                break;
            }
            case 'invalidShims': {
                const { themeID, deps } = event;
                const shimLines = deps.map(d => `   - ${d}\n`);
                console.log(
                    [
                        'One or more invalid shim configurations were found ',
                        `while bundling ${themeID}. RequireJS does not support `,
                        'shim configuration for modules that already call "define". ',
                        'You may have unexpected results when running the bundle in ',
                        `your store\n  Invalid shims for:\n`,
                        ...shimLines,
                    ].join(''),
                );
                break;
            }
            case 'createBundle:end': {
                const { timing, themeID, bundleName, bundleSize } = event;
                const total = timing.end - timing.start;
                const size = prettyBytes(bundleSize);

                console.log(
                    `Finished bundling ${bundleName} (${size} unminified) ` +
                        `for ${themeID} in ${prettyMS(total)}`,
                );
                break;
            }
        }
    });
}
