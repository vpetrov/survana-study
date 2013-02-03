/** public/js/storage.js
 * Ensures that all values written to localStorage are in a namespace identified by the current study id
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define(
    [
    ],
    function () {
        "use strict";

        var prefix = window['study-id'];

        if (!prefix) {
            console.error('No study ID assigned. Namespacing will not be available.');
            prefix = '';
        } else {
            prefix += '-';
        }

        function get(key, default_value) {
            var value;

            if (!key) {
                return default_value;
            }

            value = window.localStorage[prefix + key];

            return (value === undefined) ? default_value : value;
        }

        function put(key, value) {
            var i;

            if (key === undefined) {
                return false;
            }

            //multiple keys passed in as an object
            if (typeof key === 'object') {
                for (i in key) {
                    if (key.hasOwnProperty(i)) {
                        window.localStorage[prefix + i] = key[i];
                    }
                }
            } else {
                //traditional key=value
                window.localStorage[prefix + key] = value;
            }

            return true;
        }

        function has(key) {
            var value;

            if (key === undefined) {
                return false;
            }

            value = window.localStorage[prefix + key];

            return (value !== undefined) && value.length;
        }

        function remove(key) {
            if (key === undefined) {
                return false;
            }

            if (!has(key)) {
                return false;
            }

            delete window.localStorage[prefix + key];

            return true;
        }

        return {
            'get':      get,
            'put':      put,
            'has':      has,
            'remove':   remove
        };
    }
);
