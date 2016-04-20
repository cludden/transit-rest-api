'use strict';

const _ = require('lodash');

module.exports = {
    isExpression(value) {
        if (_.isObject(value) && !_.isDate(value) && !_.isArray(value)) {
            return true;
        }
        return false;
    }
};
