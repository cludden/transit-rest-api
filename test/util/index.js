'use strict';

const qs = require('qs');
const transit = require('transit-js');

const encoder = transit.writer('json');

module.exports = {
    stringifyQuery(query) {
        if (query.filter) {
            query.filter = encoder.write(query.filter);
        }
        return qs.stringify(query);
    },


    parseQuery(stringified) {
        return qs.parse(stringified);
    }
};
