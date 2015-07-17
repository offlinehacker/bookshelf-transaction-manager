'use strict';

var expect = require('chai').expect;
var sinon  = require('sinon');

var bookshelf = require('bookshelf');


describe('bookshelf transaction manager', function() {
  before(function() {
    var knex = require('knex')({
      client: 'sqlite3', connection: { filename: ':memory:'}
    });
    this.bookshelf = require('bookshelf')(knex);
  });

  before(function() {
    this.bookshelf.plugin('registry');
    this.bookshelf.plugin(require('../'));
  });

  before(function() {
    this.transaction = sinon
      .stub(this.bookshelf, 'transaction')
      .callsArgWith(0, 'transaction');
  });

  beforeEach(function () {
    this.transaction.reset();
  });

  beforeEach(function() {
    this.bookshelf._models = {};
    this.Model = this.bookshelf.Model.extend({
      tableName: 'records'
    });

    this.bookshelf.model('Record', this.Model);
  });

  describe('withTransaction', function() {
    beforeEach(function(next) {
      var self = this;
      this.bookshelf.withTransaction(function(trx) {
        self.trx = trx;
        next();
      });
    });

    it('should create transaction', function() {
      expect(this.transaction).to.have.been.called;
    });

    it('should have properties defined', function() {
      expect(this.trx.model).to.not.be.undefined;
      expect(this.trx.collection).to.not.be.undefined;
      expect(this.trx.transaction).to.not.be.undefined;
    });

    it('should return extended registered models', function() {
      expect(this.trx.model('Record')).to.not.be.undefined;
      expect(this.trx.model('Record').forge()._transaction)
        .to.be.equal('transaction');
    });
  });
});
