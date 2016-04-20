'use strict';

const async = require('async');
const joi = require('joi');
const processClause = require('../process/clause');
const _ = require('lodash');


/**
 * Parse and process any filter parameter passed with the request
 * @param  {Object} service - current service object
 * @param  {Object} req - the request object
 * @param  {Object} [req.query] - initially parsed query parameters
 * @param  {String} [req.query.filter] - the transit-js query filter
 * @param  {Object} options
 * @param  {String[]} [options.blacklist] - a list of fields to forbid in the query filter
 * @param  {String[]} [options.whitelist] - a list of fields to allow in the query filter
 * @param  {Function} cb
 */
module.exports = function(service, req, options, cb) {
    const Err = service._error;
    // if no filter parameter found, return
    let filter = _.get(req, 'query.filter');
    if (!filter) {
        return async.setImmediate(cb);
    }
    async.auto({
        // decode transit-js query filter
        decoded: function decode(fn) {
            let err = Err.badRequest('Unable to decode transit query filter');
            _decode(service._decoder, filter, err, fn);
        },

        // validate options
        options: function validateOptions(fn) {
            let stringArray = joi.array().items(
                joi.string()
            ).single();
            let schema = joi.object({
                blacklist: stringArray,
                interceptors: joi.object(),
                logicalOperators: stringArray.default('$or', '$and'),
                modifiers: joi.object(),
                whitelist: stringArray
            })
            .unknown(false)
            .required();
            joi.validate(options, schema, {}, function(err, validated) {
                if (err) {
                    err = Err.badRequest(`Invalid 'filter' options: ${err.message}`);
                    return fn(err);
                }
                validated = checkFieldsToForbid(validated);
                fn(null, validated);
            });
        },

        // process the query filter
        filter: ['decoded', 'options', function processFilter(fn, r) {
            console.log(r.decoded);
            processClause(service, r.decoded, r.options, fn);
        }]
    }, function(err, r) {
        if (err) {
            return cb(err);
        }
        cb(null, r.filter);
    });
};


// separate the try catch block from the rest of the method in order
// to allow the method to be optimized by v8
function _decode(decoder, filter, error, cb) {
    try {
        let decoded = decoder.read(filter);
        return async.setImmediate(function() {
            cb(null, decoded);
        });
    } catch (e) {
        async.setImmediate(function() {
            cb(error);
        });
    }
}


// inspect options for blacklist/whitelist and determine if we
// should forbid fields
function checkFieldsToForbid(options) {
    if (_.isArray(options.whitelist) && options.whitelist.length) {
        options._shouldWhitelist = true;
    } else if (_.isArray(options.blacklist) && options.blacklist.length) {
        options._shouldBlacklist = true;
    }
    return options;
}
