import createLogger from 'console-log-level';

const envLevel = process.env.BALER_LOG_LEVEL as createLogger.LogLevelNames;

export let log: createLogger.Logger = createLogger({
    // Defaulting to `error` here for when baler is used as
    // a library. In bin/cli, it's configurable
    level: envLevel || 'error',
    prefix: level => {
        return level === 'debug' || level === 'trace'
            ? `${level.toUpperCase()} at ${new Date().toISOString()}\n`
            : '';
    },
});
