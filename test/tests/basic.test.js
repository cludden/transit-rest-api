/*jshint expr:true */
'use strict';

const async = require('async');
const expect = require('chai').expect;
const httpMocks = require('node-mocks-http');
const qs = require('qs');
const TRAService = require('../../index');
const util = require('../util');
const utils = require('../../lib/utils');
const _ = require('lodash');

const URL = '/api/resource';

describe('basic tests', function() {
    const service = new TRAService({
        filter: {
            logicalOperators: [
                '$and', '$or'
            ],
            modifiers: {
                $eq: true,
                $exists: true,
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
                    status: ['active', 'pending'],
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
                    interceptNormalizedExpression(field, expression, options, cb) {
                        if (_.isArray(expression)) {
                            return async.setImmediate(function() {
                                return cb(null, {$in: expression});
                            });
                        } else if (!utils.isExpression(expression)) {
                            return async.setImmediate(function() {
                                return cb(null, {$eq: expression});
                            });
                        }
                        return async.setImmediate(function() {
                            return cb(null, expression);
                        });
                    },
                    interceptors: {
                        first: function(value, options, cb) {
                            async.setImmediate(function() {
                                cb(null, value.toLowerCase());
                            });
                        }
                    }
                }
            },
            test(filter) {
                // last
                expect(filter).to.have.property('last').that.is.an('object').with.property('$eq', 'smith');

                // first
                expect(filter).to.have.property('first').that.is.an('object');
                expect(filter.first).to.have.property('$regex');
                let re = filter.first.$regex;
                expect('bobby').to.match(re);
                expect('Bobby').to.not.match(re);
                expect('ricky bobby').to.not.match(re);

                // status
                expect(filter).to.have.property('status').that.is.an('object');
                expect(filter.status).to.have.property('$in').that.is.an('array').with.lengthOf(2);
                expect(filter.status.$in).to.eql(['active', 'pending']);

                // $or
                expect(filter).to.have.property('$or').that.is.an('array').with.lengthOf(2);
                expect(filter.$or[0]).to.be.an('object').with.property('createdAt').that.is.an('object');
                expect(filter.$or[0].createdAt).to.have.property('$gte').that.is.a('date');
                expect(filter.$or[0].createdAt).to.have.property('$lt').that.is.a('date');
                expect(filter.$or[1]).to.be.an('object').with.property('account.balance').that.is.an('object');
                expect(filter.$or[1]['account.balance']).to.have.property('$gte', 100000.00);
                expect(filter.$or[1]['account.balance']).to.have.property('$lt', 200000.00);
            }
        }, {
            query: {
                filter: {
                    $or: [{
                        tags: {
                            $nin: ['this-thing', 'that "other" thing!']
                        }
                    }, {
                        a: {
                            $exists: true
                        }
                    }]
                }
            },
            test(filter) {
                expect(filter).to.have.property('$or').that.is.an('array').with.lengthOf(2);
                expect(filter.$or[0]).to.be.an('object').with.property('tags').that.is.an('object');
                expect(filter.$or[0].tags).to.have.property('$nin').that.is.an('array').with.lengthOf(2);
                expect(filter.$or[0].tags.$nin).to.eql(['this-thing', 'that "other" thing!']);
                expect(filter.$or[1]).to.be.an('object').with.property('a').that.is.an('object');
                expect(filter.$or[1].a).to.have.property('$exists', true);
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
                if (test.options) {
                    service.parseQueryString(req, test.options, function(err, parsed) {
                        if (err) {
                            console.log(err, JSON.stringify(parsed));
                        }
                        expect(err).to.not.exist;
                        expect(parsed).to.be.an('object').with.property('filter').that.is.an('object');
                        test.test(parsed.filter);
                        done();
                    });
                } else {
                    service.parseQueryString(req, function(err, parsed) {
                        if (err) {
                            console.log(err, JSON.stringify(parsed));
                        }
                        expect(err).to.not.exist;
                        expect(parsed).to.be.an('object').with.property('filter').that.is.an('object');
                        test.test(parsed.filter);
                        done();
                    });
                }
            });
        });

        let whitelistTests = [{
            query: {
                filter: {
                    a: 'test',
                    b: 'test',
                    $or: [{
                        c: 'test'
                    }]
                }
            },
            whitelist: ['a', 'b'],
            test(err) {
                expect(err).to.be.an('object');
                expect(err).to.have.property('status', 400);
                expect(err).to.have.property('title', 'Bad Request');
                expect(err).to.have.property('detail').that.is.a('string');
            }
        }, {
            query: {
                filter: {
                    'account.balance': {
                        $gte: 100.562394
                    },
                    secret: true
                }
            },
            whitelist: ['account.balance'],
            test(err) {
                expect(err).to.be.an('object');
                expect(err).to.have.property('status', 400);
                expect(err).to.have.property('title', 'Bad Request');
                expect(err).to.have.property('detail').that.is.a('string');
            }
        }];

        whitelistTests.forEach(function(test, i) {
            test.stringified = util.stringifyQuery(test.query);
            test.parsed = util.parseQuery(test.stringified);
            test.url = URL + '?' + test.stringified;

            it(`should allow fields to be whitelisted (${test.url})`, function(done) {
                let req = httpMocks.createRequest({
                    method: 'GET',
                    query: test.parsed,
                    url: test.url
                });
                service.parseQueryString(req, {
                    filter: {
                        whitelist: test.whitelist
                    }
                }, function(err) {
                    test.test(err);
                    done();
                });
            });
        });

        let blacklistTests = [{
            query: {
                filter: {
                    a: 'test',
                    b: 'test',
                    $or: [{
                        c: 'test'
                    }]
                }
            },
            blacklist: ['c'],
            test(err) {
                expect(err).to.be.an('object');
                expect(err).to.have.property('status', 400);
                expect(err).to.have.property('title', 'Bad Request');
                expect(err).to.have.property('detail').that.is.a('string');
            }
        }, {
            query: {
                filter: {
                    'account.balance': {
                        $gte: 100.562394
                    },
                    secret: true
                }
            },
            blacklist: ['secret'],
            test(err) {
                expect(err).to.be.an('object');
                expect(err).to.have.property('status', 400);
                expect(err).to.have.property('title', 'Bad Request');
                expect(err).to.have.property('detail').that.is.a('string');
            }
        }];

        blacklistTests.forEach(function(test, i) {
            test.stringified = util.stringifyQuery(test.query);
            test.parsed = util.parseQuery(test.stringified);
            test.url = URL + '?' + test.stringified;

            it(`should allow fields to be blacklisted (${test.url})`, function(done) {
                let req = httpMocks.createRequest({
                    method: 'GET',
                    query: test.parsed,
                    url: test.url
                });
                service.parseQueryString(req, {
                    filter: {
                        blacklist: test.blacklist
                    }
                }, function(err) {
                    test.test(err);
                    done();
                });
            });
        });


        it('should allow for field names to be mapped', function(done) {
            let req = httpMocks.createRequest({
                method: 'GET',
                query: util.parseQuery(util.stringifyQuery({
                    filter: {
                        'nested.attr': true,
                        id: [1, 2, 3],
                        'created-at': {
                            $lt: new Date('01/01/2016')
                        }
                    }
                }))
            });
            service.parseQueryString(req, {
                filter: {
                    mapFields: [
                        function(field) {
                            if (!/^((?!\.).)*$/g.test(field)) {
                                return field;
                            }
                            return _.camelCase(field);
                        },
                        function(field) {
                            if (field.toLowerCase() === 'id') {
                                return '_id';
                            }
                            return field;
                        }
                    ]
                }
            }, function(err, parsed) {
                expect(err).to.not.exist;
                expect(parsed).to.be.an('object').with.property('filter').that.is.an('object');
                expect(parsed.filter).to.have.property('nested.attr', true);
                expect(parsed.filter).to.have.property('_id').that.eql([1,2,3]);
                expect(parsed.filter).to.have.property('createdAt').that.is.an('object').with.property('$lt').that.is.a('date');
                done();
            });
        });


        it('should allow for the interception of field values', function(done) {
            let req = httpMocks.createRequest({
                method: 'GET',
                query: util.parseQuery(util.stringifyQuery({
                    filter: {
                        first: 'Bob'
                    }
                }))
            });
            service.parseQueryString(req, {
                filter: {
                    interceptors: {
                        first(value, options) {
                            return value.toLowerCase();
                        }
                    }
                }
            }, function(err, parsed) {
                expect(err).to.not.exist;
                expect(parsed).to.be.an('object').with.property('filter').that.is.an('object');
                expect(parsed.filter).to.have.property('first', 'bob');
                done();
            });
        });


        it('should fail (400) if the filter cannot be decoded', function(done) {
            let query = qs.parse(qs.stringify({filter: 'test'}));
            let req = httpMocks.createRequest({ query });
            service.parseQueryString(req, function(err) {
                expect(err).to.be.an('object');
                expect(err).to.have.property('status', 400);
                expect(err).to.have.property('title', 'Bad Request');
                done();
            });
        });


        it('should fail (500) if an invalid modifier is defined', function(done) {
            let req = httpMocks.createRequest({
                query: util.parseQuery(util.stringifyQuery({
                    filter: {
                        first: {
                            $doSomething: 'a'
                        }
                    }
                }))
            });
            service.parseQueryString(req, {
                filter: {
                    modifiers: {
                        $doSomething: 'true'
                    }
                }
            }, function(err) {
                expect(err).to.be.an('object');
                expect(err).to.have.property('status', 500);
                expect(err).to.have.property('title', 'Server Error');
                done();
            });
        });
    });

    context('include', function() {

    });

    context('page', function() {

    });

    context('sort', function() {

    });
});
