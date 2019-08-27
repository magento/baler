import Worker from 'jest-worker';
import * as minifyWorker from './minifyWorker';

export type Minifier = {
    minifyFromFilepath: typeof minifyWorker.minifyFromFilepath;
    minifyFromString: typeof minifyWorker.minifyFromString;
    destroy(): void;
};

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
