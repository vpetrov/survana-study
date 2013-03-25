/** config.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

exports.title = 'Survana Study';

//default URL to the survana-store server
exports.store = '';

exports.routes = {
    'GET': {
        '/':                        'index',
        '/(([\\w]+))':              'study',
        '/(([\\w]+))/(([\\w]+))':   {'study': 'form'}
    },

    'POST': {
        '/':                        {'study': 'create'},
        '/form/(([\\w]+))':         {'form': 'preview'}
    }
};

exports.admins = {
};

exports.theme = {
    global: 'b',
    form: 'c',
    question: 'd',
    nav: 'a',
    content: 'c',
    input: 'c',
    select: 'c',
    radio: 'c',
    check: 'c',
    button: 'a',
    active: 'b',
    collapsible: 'a',
    bubble: 'c'
};

exports.adapters = {
    'mobile': 'adapters/jquery.mobile.1.3.0',
    'desktop': 'adapters/jquery.mobile.1.3.0'
    //'desktop':'adapters/bootstrap'
};

exports.views = {
    'mobile': 'jquery.mobile',
    'desktop': 'jquery.mobile'
    //'desktop':'bootstrap'
};

exports.lib = {
    'jquery': 'lib/jquery/1.7.2',
    'jquery.plugins': 'lib/jquery/plugins',
    'jquery.mobile': 'lib/jquery/mobile/1.3.0',
    'jquery.mobile.plugins': 'lib/jquery/mobile/plugins',
    'require': 'lib/require/2.1.5',
    'bootstrap': 'lib/bootstrap/2.0.4',
    'validation': 'lib/jquery/plugins',
    'survana.widgets': 'lib/jquery/mobile/plugins'
};
/* default database config */
exports.db = {
    name: 'study',
    host: 'localhost',
    port: 27017,
    //see https://github.com/christkv/node-mongodb-native/blob/master/docs/database.md
    server_options: {
        encoding: 'utf8',
        auto_reconnect: true
    },
    db_options: {
        native_parser: false, //couldn't get the BSON C++ parser to work on OS X
        strict: false            //false will prevent new collections from being autocreated
    }
};
