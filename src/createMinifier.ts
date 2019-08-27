import Worker from 'jest-worker';
import * as minifyWorker from './minifyWorker';

export type Minifier = ReturnType<typeof createMinifier>;

export function createMinifier() {
    const worker = (new Worker(require.resolve('./minifyWorker'), {
        forkOptions: {
            // surface console.log and friends in worker
            stdio: 'inherit',
        },
    }) as unknown) as typeof minifyWorker & InstanceType<typeof Worker>;

    return {
        minifyFromFilepath: worker.minifyFromFilepath,
        minifyFromString: worker.minifyFromString,
        destroy: worker.end.bind(worker),
    };
}
