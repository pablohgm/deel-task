/**
 * Class ResponseHelper
 */
class ResponseHelper {
    /**
     * Get a formatted object before response
     * @param data
     */
    static get(data, code) {
        if (!ResponseHelper.isError(data)) {
            return { statusCode: code || 200, data }
        }

        return { statusCode: data.statusCode, data }
    }

    /**
     * verify is the data is an error
     * @param data
     */
     static isError(data) {
        return !!data?.message && data?.statusCode
    }
}

module.exports = ResponseHelper
