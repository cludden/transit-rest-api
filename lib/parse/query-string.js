'use strict';

const async = require('async');
const parseFilter = require('./filter');
const parsePage = require('./page');
const _ = require('lodash');

/**
 * Extract all relevant info from a request query string
 * @param  {Object} req - the request object
 * @param  {Object} [options]
 * @param  {Function} cb
 */
module.exports = function(service, req, options, cb) {
    let _options = _.merge({}, service._options, options);
    // parse various parameters
    async.parallel({
        filter(fn) {
            let filterOptions = _.get(_options, 'filter', {});
            parseFilter(service, req, filterOptions, fn);
        },

        page(fn) {
            let pageOptions = _.get(_options, 'page', {});
            parsePage(service, req, pageOptions, fn);
        }
    }, cb);
};
