import createLogger from 'console-log-level';

const envLevel = process.env.BALER_LOG_LEVEL as createLogger.LogLevelNames;

export let log: createLogger.Logger = createLogger({
    level: envLevel || 'error',
    prefix: level => {
        return level === 'debug' || level === 'trace'
            ? new Date().toISOString()
            : '';
    },
});
