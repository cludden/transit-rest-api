'use strict';

const async = require('async');
const parse = require('./lib/parse');
const transit = require('./lib/transit');
const _ = require('lodash');

function TransitRest(options) {
    this._options = options || {};
    this._decoder = transit.createDecoder(this._options);
    this._encoder = transit.createEncoder(this._options);
}

TransitRest.prototype.parseQuery = function(req, options, cb) {
    const self = this;
    if (_.isFunction(options)) {
        cb = options;
        options = {};
    }
    return parse.query.call(self, req, options, cb);
};

module.exports = TransitRest;
