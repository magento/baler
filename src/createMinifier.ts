import Worker from 'jest-worker';
import { minify } from './minifyWorker';

export function createMinifier() {
    const worker = new Worker(require.resolve('./minifyWorker'), {
        forkOptions: {
            // surface console.log and friends in worker
            stdio: 'inherit',
        },
    });

    return (worker as any).minify as typeof minify;
}
