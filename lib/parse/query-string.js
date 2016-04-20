'use strict';

const async = require('async');
const parseFilter = require('./filter');
const _ = require('lodash');

/**
 * Extract all relevant info from a request query string
 * @param  {Object} req - the request object
 * @param  {Object} [options]
 * @param  {Function} cb
 */
module.exports = function(service, req, options, cb) {
    // handle optional 'options' argument
    if (_.isFunction(options)) {
        cb = options;
        options = {};
    }
    let _options = _.merge({}, service._options, options);

    // parse various parameters
    async.parallel({
        filter(fn) {
            parseFilter(service, req, _options.filter || {}, fn);
        }
    }, cb);
};
