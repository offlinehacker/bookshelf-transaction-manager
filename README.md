# Bookshelf joi valitator

Bookshelf joi validation plugin validates data using joi schema

## Installation

    npm install bookshelf-joi-validator

Then in your bookshelf configuration:

    var bookshelf = require('bookshelf')(knex);
    bookshelf.plugin(require('bookshelf-joi-validator');

## Usage

Define bookshelf model:

  var user = Joi.string().alphanum().min(3).max(30);
  var pass = Joi.string().regex(/[a-zA-Z0-9]{3,30}/);
  var uuid = Joi.string().guid();

  var model = bookshelf.Model.extend({
    tableName: 'users',

    schema: {
      create: Joi.object().keys({
        user: user.required(),
        pass: pass.required(),
        uuid: uuid.required()
      }),
      update: Joi.object().keys({
        user: user,
        pass: pass
      })
    }
  });

Upon saving or creation of model, plugin checks if data is valid, and on error
raises joi validation error.

## License

[MIT](https://opensource.org/licenses/MIT)

## Author

[offlinehacker](mailto:jakahudoklin@gmail.com)
