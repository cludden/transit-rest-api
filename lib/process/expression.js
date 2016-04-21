'use strict';

const async = require('async');
const intercept = require('./intercept');
const util = require('../utils');
const value = require('./value');
const _ = require('lodash');


/**
 * Process an expression
 * @param  {Object} service - the active service
 * @param  {String} field - field name
 * @param  {*} expression - the expression to process
 * @param  {Object} options
 * @param  {Function} cb
 */
module.exports = function processExpression(service, field, expression, options, cb) {
    const err = service._error;

    // if expression is actually an expression, process it
    if (util.isExpression(expression)) {
        return value(service, field, expression, options, cb);
    }

    // if expression is array, process each element as an expression
    if (_.isArray(expression)) {
        return async.map(expression, function(exp, fn) {
            processExpression(service, field, exp, options, fn);
        }, function(err, normalized) {
            if (err) {
                return cb(err);
            }
            cb(null, normalized);
        });
    }

    // otherwise, we assume that the expression is actually just a value
    intercept(field, expression, options, cb);
};
