/*jshint expr:true */
'use strict';

const async = require('async');
const expect = require('chai').expect;
const httpMocks = require('node-mocks-http');
const TRAService = require('../../index');
const util = require('../util');

const URL = '/api/resource';

describe('basic tests', function() {
    const service = new TRAService({
        filter: {
            logicalOperators: [
                '$and', '$or'
            ],
            modifiers: {
                $eq: true,
                $gt: true,
                $gte: true,
                $lt: true,
                $lte: true,
                $in: true,
                $ne: true,
                $nin: true,
                $startsWith: function(field, value, cb) {
                    let _value = new RegExp(`^${value}*`);
                    async.setImmediate(function() {
                        cb(null, {
                            $regex: _value
                        });
                    });
                }
            }
        }
    });

    context('fields', function() {

    });

    context('filters', function() {
        let tests = [{
            query: {
                filter: {
                    last: 'smith',
                    first: {
                        $startsWith: 'Bob'
                    },
                    $or: [
                        {
                            createdAt: {
                                $gte: new Date('01/01/2015'),
                                $lt: new Date('01/01/2016')
                            }
                        },
                        {
                            'account.balance': {
                                $gte: 100000.00,
                                $lt: 200000.00
                            }
                        }
                    ]
                }
            },
            options: {
                filter: {
                    interceptors: {
                        first: function(value, cb) {
                            async.setImmediate(function() {
                                cb(null, value.toLowerCase());
                            });
                        }
                    }
                }
            },
            test: function(filter) {
                // last
                expect(filter).to.have.property('last', 'smith');

                // first
                expect(filter).to.have.property('first').that.is.an('object');
                expect(filter.first).to.have.property('$regex');
                let re = filter.first.$regex;
                expect(re).to.match('bobby');
                expect(re).to.not.match('Bobby');
                expect(re).to.not.match('ricky bobby');

                // $or
                expect(filter).to.have.property('$or').that.is.an('array').with.lengthOf(2);
                expect(filter.$or[0]).to.be.an('object').with.property('createdAt').that.is.an('object');
                expect(filter.$or[0].createdAt).to.have.property('$gte').that.is.a('date');
                expect(filter.$or[0].createdAt).to.have.property('$lt').that.is.a('date');
            }
        }];

        tests.forEach(function(test, i) {
            test.stringified = util.stringifyQuery(test.query);
            test.parsed = util.parseQuery(test.stringified);
            test.url = URL + '?' + test.stringified;

            it(`should correctly parse transit-js queries (${test.url})`, function(done) {
                let req = httpMocks.createRequest({
                    method: 'GET',
                    url: test.url,
                    query: test.parsed
                });
                service.parseQueryString(req, test.options || {}, function(err, parsed) {
                    console.log(err, parsed);
                    expect(err).to.not.exist;
                    expect(parsed).to.be.an('object').with.property('filter').that.is.an('object');
                    test.test(parsed.filter);
                    done();
                });
            });
        });


        it('should allow fields to be whitelisted');
        it('should allow fields to be blacklisted');
        it('should allow for field names to be mapped');
        it('should allow for the interception of field values');
    });

    context('include', function() {

    });

    context('page', function() {

    });

    context('sort', function() {

    });
});
