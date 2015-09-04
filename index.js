'use strict';

var Promise = require('bluebird');
var Joi = require('joi');
var _ = require('lodash');

function ValidationError(err) {
  this.name = 'ValidationError';
  this.message = err.toString();
  this.err = err;
}
ValidationError.prototype = Error.prototype;

module.exports = function (bookshelf) {
  var Model = bookshelf.Model;

  bookshelf.Model = Model.extend({

    /**
     * Fields to ignore by default
     */
    defaultIgnoreValidate:
      ['updated_at', 'created_at', 'deleted_at', 'restored_at'],

    constructor: function() {
      Model.prototype.constructor.apply(this, arguments);

      this.schema = this.schema || {};

      if (this.schema.create) {
        this.on('creating', this.validateCreate, this);
      }

      if (this.schema.update) {
        this.on('updating', this.validateUpdate, this);
      }

      if (this.schema.duplicates) {
        this.on('saving', this.validateDuplicates, this);
      }
    },

    /**
     * Validates data with a schema
     * @throws {ValidationError}
     */
    validateWith: function(schema) {
      var changed = _.omit(
        this.changed,
        this.defaultIgnoreValidate.concat(this.ignoreValidate || [])
      );

      var result = Joi.validate(changed, schema);
      if (result.error) {
        throw new ValidationError(result.error);
      }

      // Set updated values
      this.set(result.value);
    },

    /**
     * Validates upon creation
     * @throws {ValidationError}
     */
    validateCreate: function() {
      var schema = this.schema.create.options({
        noDefaults: true
      });

      this.validateWith(schema);
    },

    /**
     * Validates upon update
     * @throws {ValidationError}
     */
    validateUpdate: function() {
      var schema = this.schema.update;
      this.validateWith(schema);
    }
  });

  bookshelf.Model.ValidationError = ValidationError;
};
