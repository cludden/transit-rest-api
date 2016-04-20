'use strict';

const async = require('async');
const err = require('./lib/err');
const parseQueryString = require('./lib/parse/query-string');
const transit = require('./lib/transit');
const _ = require('lodash');

function TransitRest(options) {
    this._options = options || {};
    this._decoder = transit.createDecoder(this._options);
    this._encoder = transit.createEncoder(this._options);
    this._error = err;
}

TransitRest.prototype.parseQueryString = function(req, options, cb) {
    const self = this;
    if (_.isFunction(options)) {
        cb = options;
        options = {};
    }
    return parseQueryString(self, req, options, cb);
};

module.exports = TransitRest;
