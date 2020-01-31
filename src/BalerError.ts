/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { trace } from './trace';

/**
 * @summary A branded error type used for known
 *          categories of errors. We don't
 *          want to log an ugly stack trace on
 *          the CLI for errors we have a clear
 *          message (and known root cause) for.
 *
 */
export class BalerError extends Error {
    constructor(message: string) {
        super(message);
        Error.captureStackTrace(this, BalerError);
        trace(`Baler error created. Message: ${message}`);
    }

    get isBalerError() {
        return true;
    }
}
