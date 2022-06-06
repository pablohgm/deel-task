/**
 * Class ErrorHelper
 */
class ErrorHelper extends Error {
    /**
     * Constructor
     * @param statusCode
     * @param message
     */
    constructor(statusCode, message) {
        super()
        this.statusCode = statusCode
        this.message = message
    }
}

module.exports = ErrorHelper
