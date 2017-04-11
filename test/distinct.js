var assert = require('assert');

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var o = require('@carbon-io/atom').o(module).main
var oo = require('@carbon-io/atom').oo(module)

var util = require('./util')

__(function() {
  module.exports = o({
    _type: util.LeafnodeTestSuite,
    name: 'DistinctTests',
    description: 'distinct tests',
    colName: 'leafnode.distinct-test',
    tests: [
      o({
        _type: util.LeafnodeTest,
        name: 'DistinctTest',
        description: 'distinct test',
        doTest: function() {
          var obj1 = { "a" : 1, "b" : 2 };
          var obj2 = { "a" : 2, "b" : 3 };
          var obj3 = { "a" : 3, "b" : 3 };
          
          this.c.insert(obj1);
          this.c.insert(obj2);
          this.c.insert(obj3);

          var distincts = this.c.distinct("a");
          assert.equal(distincts.length, 3);
          distincts = this.c.distinct("a", { b : 3 });
          assert.equal(distincts.length, 2);
        }
      })
    ]
  })
})

