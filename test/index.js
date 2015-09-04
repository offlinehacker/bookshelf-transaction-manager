'use strict';

var expect = require('chai').expect;
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

var bookshelf = require('bookshelf');
var Joi = require('joi');

chai.use(chaiAsPromised);

describe('bookshelf transaction manager', function() {
  before(function() {
    this.knex = require('knex')({
      client: 'sqlite3', connection: { filename: ':memory:'}
    });
    this.bookshelf = require('bookshelf')(this.knex);
    this.bookshelf.plugin(require('../'));
  });

  before(function() {
    return this.knex.schema
      .createTable('users', function(table) {
        table.increments('id').primary();
        table.string('user').unique();
        table.string('pass');
        table.string('uuid').unique();
      });
  });

  before(function() {
    var Model = this.bookshelf.Model;

    var user = Joi.string().alphanum().min(3).max(30);
    var pass = Joi.string().regex(/[a-zA-Z0-9]{3,30}/);
    var uuid = Joi.string().guid();

    this.User = this.bookshelf.Model.extend({
      tableName: 'users',

      schema: {
        create: Joi.object().keys({
          user: user.required(),
          pass: pass.required(),
          uuid: uuid.required()
        }),
        update: Joi.object().keys({
          user: user.optional(),
          pass: pass.optional()
        })
      }
    });
  });

  it('should create object if valid data is passed', function() {
    return expect(this.User.forge({
      user: 'admin', pass: 'abc',
      uuid: 'C56A4180-65AA-42EC-A945-5FD21DEC0538'
    }).save()).to.be.fulfilled;
  });

  it('should update with valid data', function() {
    return expect(
      this.User.forge({user: 'admin'}).fetch().then(function(user) {
        user.set({user: 'user', pass: 'abc'});
        return user.save();
      })
    ).to.be.fulfilled;
  });

  it('should error if invalid data is passed', function() {
    return expect(
      this.User.forge({
        user: 'admin', pass: 'abc',
        uuid: 'notuuid'
      }).save()
    )
    .to.be.rejectedWith(
      Error,
      'ValidationError: child "uuid" fails because ["uuid" must be a valid GUID]'
    );
  });

  it('should fail if update data is invalid', function() {
    return expect(
      this.User.forge({user: 'user'}).fetch().then(function(user) {
        user.set({user: 'admin', pass: 'abc', somefiled: 'abcd'});
        return user.save();
      })
    )
    .to.be.rejectedWith(
      Error,
      'ValidationError: "somefiled" is not allowed'
    );
  });

});
