'use strict';

const async = require('async');
const processExpression = require('./expression');
const util = require('../utils');
const _ = require('lodash');

module.exports = function processClause(service, clause, options, cb) {
    const err = service._error;

    // ensure that clause is actually clause-like
    if (!util.isExpression(clause)) {
        return async.setImmediate(function() {
            cb(err.badRequest(`process.clause requires a query clause an argument`));
        });
    }

    let keys = Object.keys(clause);
    async.reduce(keys, {}, function(result, field, fn) {
        let expression = clause[field];
        let shouldWhitelist = options._shouldWhitelist;

        // verify 'field' is not blacklisted. we check blacklist first in order to
        // allow logical operators to be blacklisted
        if (!shouldWhitelist && options._shouldBlacklist && options.blacklist.indexOf(field) !== -1) {
            return async.setImmediate(function() {
                fn(err.badRequest(`Forbidden field provided in query filter: ${field}`));
            });
        }

        // if key is a logical operator, process value as a clause
        if (options.logicalOperators.indexOf(field) !== -1) {
            if (!_.isArray(expression)) {
                return async.setImmediate(function() {
                    fn(err.badRequest(`Logical operator '${field}' requires an array value`));
                });
            }
            // process array of clauses
            return async.map(expression, function(_clause, _fn) {
                processClause(service, _clause, options, _fn);
            }, function(err, normalized) {
                if (err) {
                    return fn(err);
                }
                result[field] = normalized;
                fn(null, result);
            });
        }

        // if whitelisting, ensure field is found in the whitelist. we don't force users
        // to include logical operators in whitelist
        if (shouldWhitelist && options.whitelist.indexOf(field) === -1) {
            return async.setImmediate(function() {
                fn(err.badRequest(`Forbidden field provided in query filter: ${field}`));
            });
        }

        // otherwise, assume value is an expression
        processExpression(service, field, expression, options, function(err, normalized) {
            if (err) {
                return fn(err);
            }
            if (!_.isFunction(options.interceptNormalizedExpression)) {
                result[field] = normalized;
                return fn(null, result);
            }
            options.interceptNormalizedExpression(field, normalized, options, function(err, intercepted) {
                if (err) {
                    return fn(err);
                }
                result[field] = intercepted;
                fn(null, result);
            });
        });
    }, function(err, processed) {
        cb(err, processed);
    });
};
