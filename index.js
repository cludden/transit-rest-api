'use strict';

const async = require('async');
const err = require('./lib/err');
const parseQueryString = require('./lib/parse/query-string');
const transit = require('./lib/transit');
const _ = require('lodash');

function TransitRest(options) {
    this._options = options || /* istanbul ignore next */ {};
    this._decoder = transit.createDecoder(this._options);
    this._encoder = transit.createEncoder(this._options);
    this._error = err;
}


/**
 * Decode trasnit encoded data
 * @param  {String} encoded - encoded data
 * @param  {Function} [cb] - optional asynchronous callback
 */
TransitRest.prototype.decode = function(encoded, cb) {
    const self = this;
    if (!cb) {
        return self._decoder.read(encoded);
    }
    const result = _.attempt(function() {
        return self._decoder.read(encoded);
    });
    if (_.isError(result)) {
        return async.setImmediate(function() {
            cb(result);
        });
    }
    return async.setImmediate(function() {
        cb(null, result);
    });
};


/**
 * Transit encode raw data
 * @param  {*} raw - raw data to encode
 * @param  {Function} [cb]
 */
TransitRest.prototype.encode = function(raw, cb) {
    const self = this;
    if (!cb) {
        return self._encoder.write(raw);
    }
    const result = _.attempt(function() {
        return self._encoder.write(raw);
    });
    if (_.isError(result)) {
        return async.setImmediate(function() {
            cb(result);
        });
    }
    return async.setImmediate(function() {
        cb(null, result);
    });
};


/**
 * Parse a query string
 * @param  {Object} req
 * @param  {Object} [options]
 * @param  {Function} cb
 */
TransitRest.prototype.parseQueryString = function(req, options, cb) {
    const self = this;
    if (_.isFunction(options)) {
        cb = options;
        options = {};
    }
    return parseQueryString(self, req, options, cb);
};

module.exports = TransitRest;
