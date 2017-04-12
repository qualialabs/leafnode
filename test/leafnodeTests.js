var assert = require('assert')
var sinon = require('sinon')

var _ = require('lodash')
var mongodbURI = require('mongodb-uri')

var __ = require('@carbon-io/fibers').__(module)
var o = require('@carbon-io/atom').o(module)
var testtube = require('@carbon-io/test-tube')

var Collection = require('../lib/collection')
var leafnode = require('../lib/leafnode')

var util = require('./util')


__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'leafnodeTests',
    description: 'leafnode tests',
    setup: function() {
      this.standAloneURI = mongodbURI.parse(util.STAND_ALONE_DB_URI)
      assert.equal(this.standAloneURI.hosts.length, 1)
      this.standAloneURI.database = util.DB_NAME
      this.standAloneURI = mongodbURI.format(this.standAloneURI)
      this.replSetURI = undefined
      this.replSetSingleNodeURI = undefined
      if (!_.isUndefined(util.REPL_SET_DB_URI)) {
        this.replSetURI = util.REPL_SET_DB_URI
        var parsedURI = mongodbURI.parse(this.replSetURI)
        parsedURI.database = util.DB_NAME
        this.replSetURI = mongodbURI.format(parsedURI)
        parsedURI.hosts.splice(1, parsedURI.hosts.length - 1)
        this.replSetSingleNodeURI = mongodbURI.format(parsedURI)
      }
    },
    _throwReplSetSkipTestError: function() {
      if (_.isUndefined(util.REPL_SET_DB_URI)) {
        throw new testtube.errors.SkipTestError(
          'repl set uri not configured (env:LEAFNODE_REPL_SET_MONGODB_URI)')
      }
    },
    tests: [
      o({
        _type: testtube.Test,
        name: 'connectionTest',
        description: 'connection test',
        doTest: function() {
          var con = undefined
          try {
            con = leafnode.connect(this.parent.standAloneURI)
            assert.equal(con.databaseName, util.DB_NAME)
            assert(con._nativeDB.serverConfig instanceof leafnode.mongodb.Server)
          } finally {
            con.close()
          }
        }
      }),
      o({
        _type: testtube.Test,
        name: 'replSetConnectionTest',
        description: 'replSet connection test',
        doTest: function() {
          var con = undefined
          this.parent._throwReplSetSkipTestError()
          try {
            con = leafnode.connect(this.parent.replSetURI)
            assert.equal(con.databaseName, util.DB_NAME)
            assert(con._nativeDB.serverConfig instanceof leafnode.mongodb.ReplSet)
          } finally {
            con.close()
          }
        }
      }),
      o({
        _type: testtube.Test,
        name: 'singleNodeConnectionTest',
        description: 'single node connection test',
        doTest: function() {
          var self = this
          var con = undefined
          assert.doesNotThrow(function() {
            try {
              var con = leafnode.connect(self.parent.standAloneURI, {}, true)
            } finally {
              con.close()
            }
          }, Error)
          try {
            con = leafnode.connect(this.parent.standAloneURI, {}, true)
            assert.equal(con.databaseName, util.DB_NAME)
            assert(con._nativeDB.serverConfig instanceof leafnode.mongodb.Server)
          } finally {
            con.close()
          }
        }
      }),
      o({
        _type: testtube.Test,
        name: 'replSetSingleNodeConnectionTest',
        description: 'replSet single node connection test',
        doTest: function() {
          var self = this
          var con = undefined
          this.parent._throwReplSetSkipTestError()
          assert.throws(function() {
            leafnode.connect(self.parent.replSetURI, {}, true)
          }, Error)
          try {
            con = leafnode.connect(this.parent.replSetSingleNodeURI, {}, true)
            assert.equal(con.databaseName, util.DB_NAME)
            assert(con._nativeDB.serverConfig instanceof leafnode.mongodb.Server)
          } finally {
            con.close()
          }
        }
      }),
      o({
        _type: testtube.Test,
        name: 'verifySingleNodeConnectionDatabaseOptionsHonoredTest',
        description: 'verify that database options are honored test',
        setup: function() {
          counter = 0
          this.pkFactory = {
            createPk: function() {
              return counter++
            }
          }
        },
        doTest: function() {
          this.parent._throwReplSetSkipTestError()
          var self = this
          var con = undefined
          var col = undefined
          try {
            con = leafnode.connect(
              this.parent.standAloneURI, {db: {pkFactory: this.pkFactory}}, true)
            assert.equal(con.databaseName, util.DB_NAME)
            assert(con._nativeDB.serverConfig instanceof leafnode.mongodb.Server)
            col = con.createCollection('foo')
            for (var i = 0; i < 10; i++) {
              col.insert({foo: i})
            }
            assert.equal(col.findOne({foo: 2})._id, 2)
            assert.equal(col.findOne({foo: 5})._id, 5)
            assert.equal(col.findOne({foo: 8})._id, 8)
          } finally {
            col.drop()
            con.close()
          }
        }
      })
    ]
  })
})

