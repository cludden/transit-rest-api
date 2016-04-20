'use strict';

const transit = require('transit-js');
const _ = require('lodash');

module.exports = {
    createDecoder(options) {
        const decoder = transit.reader('json', {
            arrayBuilder: {
                init(node) {
                    return [];
                },
                add(ret, val, node) {
                    ret.push(val);
                },
                finalize(ret, node) {
                    return ret;
                },
                fromArray(arr, node) {
                    return arr;
                }
            },
            mapBuilder: {
                init(node) {
                    return {};
                },
                add(ret, key, val, node) {
                    _.set(ret, key, val);
                    return ret;
                },
                finalize(ret, node) {
                    return ret;
                }
            }
        });
        return decoder;
    },


    createEncoder(options) {
        const encoder = transit.writer('json');
        return encoder;
    }
};
