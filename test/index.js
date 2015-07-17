'use strict';

var expect = require('chai').expect,
    chai = require('chai'),
    sinon  = require('sinon');

var bookshelf = require('bookshelf');


chai.use(require('sinon-chai'));

describe('bookshelf transaction manager', function() {
  before(function() {
    var knex = require('knex')({
      client: 'sqlite3', connection: { filename: ':memory:'}
    });
    this.bookshelf = require('bookshelf')(knex);
  });

  before(function() {
    this.fetch = sinon.stub(this.bookshelf.Model.prototype, 'fetch');
    this.fetchAll = sinon.stub(this.bookshelf.Model.prototype, 'fetchAll');
    this.save = sinon.stub(this.bookshelf.Model.prototype, 'save');
    this.destroy = sinon.stub(this.bookshelf.Model.prototype, 'destroy');

    this.fetchCollection = sinon.stub(this.bookshelf.Collection.prototype, 'fetch');
    this.fetchOneCollection = sinon.stub(this.bookshelf.Collection.prototype, 'fetchOne');
  });

  beforeEach(function() {
    this.fetch.reset();
    this.fetchAll.reset();
    this.save.reset();
    this.destroy.reset();

    this.fetchCollection.reset();
    this.fetchOneCollection.reset();
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

    describe('having registered model', function() {
      beforeEach(function() {
        this.bookshelf._models = {};
        this.Model = this.bookshelf.Model.extend({
          tableName: 'records'
        });

        this.bookshelf.model('Record', this.Model);
      });

      afterEach(function () {
        delete this.bookshelf._models;
      });

      it('should return extended registered models', function() {
        expect(this.trx.model('Record')).to.not.be.undefined;
        expect(this.trx.model('Record').forge()._transaction)
          .to.be.equal('transaction');
      });
    });

    describe('having registered collection', function() {
      beforeEach(function() {
        this.Collection = this.bookshelf.Collection.extend({});
        this.bookshelf.collection('Collection', this.Collection);
      });

      afterEach(function () {
        delete this.bookshelf._collections;
      });

      it('should return extended registered models', function() {
        expect(this.trx.collection('Collection')).to.not.be.undefined;
        expect(this.trx.collection('Collection').forge()._transaction)
          .to.be.equal('transaction');
      });
    });

    describe('relations', function() {
      beforeEach(function() {
        this.bookshelf._models = {};
        this.Related = this.bookshelf.Model.extend({
          tableName: 'related'
        });
        this.Model = this.bookshelf.Model.extend({
          tableName: 'model',

          _hasOne: function() {
            return this.hasOne('Related');
          },
          _hasMany: function() {
            return this.hasMany('Related');
          }
        });

        this.model = this.Model.forge();

        this.bookshelf.model('Model', this.Model);
        this.bookshelf.model('Related', this.Related);
      });

      afterEach(function () {
        delete this.bookshelf._models;
        delete this.bookshelf._collections;
      });

      it('should create one related object with transaction', function() {
        var Model = this.trx.model('Model').forge();
        expect(Model._hasOne().relatedData.target.forge()._transaction).to.equal('transaction');
      });

      it('should create many related object with transaction', function() {
        var Model = this.trx.model('Model').forge();
        expect(Model._hasMany().relatedData.target.forge()._transaction).to.equal('transaction');
      });
    });

    describe('methods', function() {
      beforeEach(function() {
        this.bookshelf._models = {};
        this.Related = this.bookshelf.Model.extend({
          tableName: 'related'
        });
        this.Collection = this.bookshelf.Collection.extend({});
        this.Model = this.bookshelf.Model.extend({
          tableName: 'model',

          _hasOne: function() {
            return this.hasOne('Related');
          },
          _hasMany: function() {
            return this.hasMany('Related');
          }
        });

        this.model = this.Model.forge();

        this.bookshelf.model('Model', this.Model);
        this.bookshelf.collection('Collection', this.Collection);
        this.bookshelf.model('Related', this.Related);
      });

      afterEach(function () {
        delete this.bookshelf._models;
        delete this.bookshelf._collections;
      });

      it('should pass transaction to fetch', function() {
        this.trx.model('Model').forge().fetch();
        expect(this.fetch).to.have.been.calledWith(sinon.match({transacting: 'transaction'}));
      });

      it('should pass transaction to fetchAll', function() {
        this.trx.model('Model').forge().fetchAll();
        expect(this.fetchAll).to.have.been.calledWith(sinon.match({transacting: 'transaction'}));
      });

      it('should pass transaction to save', function() {
        this.trx.model('Model').forge().save();
        expect(this.save).to.have.been.calledWith(undefined, sinon.match({transacting: 'transaction'}));
      });

      it('should pass transaction to destroy', function() {
        this.trx.model('Model').forge().destroy();
        expect(this.destroy).to.have.been.calledWith(sinon.match({transacting: 'transaction'}));
      });

      it('should pass transaction to fetch on collection', function() {
        this.trx.collection('Collection').forge().fetch();
        expect(this.fetchCollection).to.have.been.calledWith(sinon.match({transacting: 'transaction'}));
      });

      it('should pass transaction to fetch one on collection', function() {
        this.trx.collection('Collection').forge().fetchOne();
        expect(this.fetchOneCollection).to.have.been.calledWith(sinon.match({transacting: 'transaction'}));
      });
    });
  });
});
