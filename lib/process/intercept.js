'use strict';

const async = require('async');
const _ = require('lodash');


/**
 * Apply an interceptor for a given field if applicable
 * @param  {String} field - the field name
 * @param  {*} value - the current value
 * @param  {Object} options
 * @param  {Function} cb
 */
module.exports = function(field, value, options, cb) {
    let interceptor = _.get(options, `interceptors.${field}`);
    if (!_.isFunction(interceptor)) {
        return async.setImmediate(function() {
            cb(null, value);
        });
    }
    if (interceptor.length < 3) {
        let intercepted = interceptor(value, options);
        return async.setImmediate(function() {
            cb(null, intercepted);
        });
    }
    return interceptor(value, options, cb);
};
