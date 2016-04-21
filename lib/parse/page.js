'use strict';

const async = require('async');
const joi = require('joi');
const _ = require('lodash');


/**
 * Parse and process any page parameter passed with the request
 * @param  {Object} service - current service object
 * @param  {Object} req - request object
 * @param  {Object} [req.query] - initially parsed query parameters
 * @param  {Object} [req.query.page]
 * @param  {String} [req.query.page.size]
 * @param  {String} [req.query.page.number]
 * @param  {String} [req.query.page.cursor]
 * @param  {String} [req.query.page.offset]
 * @param  {String} [req.query.page.limit]
 * @param  {Object} options
 * @param  {Object} [options.size]
 * @param  {Number} [options.size.default] - the default page size if no 'size' data provided
 * @param  {Number} [options.size.min] - the minimum allowed page size
 * @param  {Number} [options.size.max] - the maximum page size
 * @param  {Function} cb
 */
module.exports = function(service, req, options, cb) {
    const Err = service._error;

    let page = _.get(req, 'query.page', {});
    async.waterfall([
        function validateOptions(fn) {
            let schema = joi.object({
                size: joi.object({
                    default: joi.number().integer(),
                    min: joi.number().integer().min(1),
                    max: joi.number().integer().min(1)
                }).unknown(false)
            }).unknown(false);
            joi.validate(options, schema, {}, function(err, validated) {
                if (err) {
                    err = Err.serverError(`Invalid 'pagination' options specified: ${err.message}`);
                    return fn(err);
                }
                fn(null, validated);
            });
        },

        function validateQuery(validated, fn) {
            let sizeOptions = validated.size || {};
            let sizeSchema = joi.number().integer();
            ['default', 'min', 'max'].forEach(function(attr) {
                if (sizeOptions[attr]) {
                    sizeSchema = sizeSchema[attr](sizeOptions[attr]);
                }
            });
            let schema = joi.object({
                size: sizeSchema,
                number: joi.number().integer().min(1).default(1),
                cursor: joi.any(),
                offset: joi.number().integer(),
                limit: sizeSchema
            });
            joi.validate(page, schema, {
                convert: true
            }, function(err, processed) {
                if (err) {
                    err = Err.badRequest(`Invalid 'pagination' instructions specified: ${err.message}`);
                    return fn(err);
                }
                // perform basic pagination calculations if 'size' and 'number' present
                if (processed.size && !page.limit) {
                    processed.limit = processed.size;
                    if (processed.number) {
                        processed.skip = (processed.number - 1) * processed.limit;
                    }
                }
                fn(null, processed);
            });
        }
    ], cb);
};
