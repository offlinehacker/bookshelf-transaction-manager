# Bookshelf transaction manager

[![Greenkeeper badge](https://badges.greenkeeper.io/offlinehacker/bookshelf-transaction-manager.svg)](https://greenkeeper.io/)

This plugin works with Bookshelf.js, available here http://bookshelfjs.org.
It provides transaction manager, which makes managment of database transactions
simpler. Transaction manager injects transactions into every bookshelf object
or collection, in transaction scope, so that you don't have to pass transaction
around.

## Installation

    npm install bookshelf-transaction-manager

Then in your bookshelf configuration:

    var bookshelf = require('bookshelf')(knex);
    bookshelf.plugin('registry')
    bookshelf.plugin(require('bookshelf-transaction-manager'));

## Usage

Insted of passing transaction around

    bookshelf.transaction(function(trx) {
        trx.model('Model').forge().fetch({transacting: trx}).then(function(model) {
            model.load(['relation'], {transacting: trx}).then(function(model) {
                model.set('key', 'value');
                return model.save({transacting: trx});
            })
        })
    })

Just use transaction manager

    bookshelf.withTransaction(function(trx) {
        trx.model('Model').forge().fetch().then(function(model) {
            model.load(['relation']).then(function(model) {
                model.set('key', 'value');
                model.save();
            })
        })
    })

Other bookshelf functions on models and collections also have transaction
passed. You can still override transaction.

## License

[MIT](https://opensource.org/licenses/MIT)

## Author

[offlinehacker](https://github.com/offlinehacker)
