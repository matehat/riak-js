var HttpClient = require('../lib/http-client'),
  seq = require('seq'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ port: 8098 }),
  bucket = 'users';
  
seq()

  .seq(function() {
    test('Save the properties of a bucket');
    db.saveBucket(bucket, { search: true }, this);
  })

  .seq(function() {
    test('Get the properties of a bucket');
    db.getBucket(bucket, this);
  })
  .seq(function(props) {
    assert.equal(props.search, true);
    this.ok();
  })
  .seq(function() {
    test('Save');
    db.save('users', 'test-search@gmail.com', { email: 'test-search@gmail.com', name: 'Testy Test for Riak Search' }, function(err, data, meta) {
      assert.equal(meta.statusCode, 204);
      assert.ok(!data);
      assert.equal(meta.key, 'test-search@gmail.com');
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Map/Reduce with search');
    db.mapreduce.search('users', 'email:test-search@gmail.com').map('Riak.mapValuesJson').run(this);
  })
  .seq(function(data) {
    assert.equal(data[0].email, "test-search@gmail.com");
    this.ok();
  })
  .seq(function() {
    test('Searching via Solr interface');
    db.search.find('users', 'email:test-search@gmail.com', function(err, data) {
      this.ok(data);
    }.bind(this));
  })
  .seq(function(data) {
    test('Finds one result');
    assert.equal(data.response.numFound, 1);
    assert.equal(data.response.docs[0].id, "test-search@gmail.com");
    this.ok(data)
  })
  .seq(function(data) {
    test('Includes the document');
    assert.equal(data.response.docs[0].fields.email, "test-search@gmail.com");
  })
  .seq(function() {
    test('Remove document');
    db.remove('users', 'test-search@gmail.com', this);
  })
  .catch(function(err) {
    console.log(err.stack);
    process.exit(1);
  });
