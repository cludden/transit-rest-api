'use strict';

module.exports = {
    badRequest(detail) {
        let self = this;
        return self._getError(400, 'Bad Request', detail);
    },

    _getError(status, title, detail) {
        return { status, title, detail };
    },

    serverError(detail) {
        let self = this;
        return self._getError(500, 'Server Error', detail);
    }
};
