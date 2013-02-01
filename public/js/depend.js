/** public/js/depend.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define(
    [
        'jquery',
        'jquery.mobile'
    ],
    function ($, $m) {
        "use strict";

        var callbacks = {};

        function register(id, callback) {
            callbacks[id] = callback;
        }

        function check(id, context, changed) {
            if (typeof (callbacks[id]) !== 'function') {
                return null;
            }

            //call the callback
            return callbacks[id].apply(this, [context, changed]); //todo: figure out if 'this' needs to be used here
        }

        function has(haystack, needle) {
            var i;

            if ((haystack === undefined) || (needle) === undefined) {
                return false;
            }

            //convert numbers to string
            needle = String(needle);

            for (i in haystack) {
                if (haystack.hasOwnProperty(i)) {
                    if (typeof (haystack[i]) === 'number') {
                        haystack[i] = String(haystack[i]);
                    }
                }
            }

            return (haystack.indexOf(needle) > -1);
        }

        function is_in(needle, haystack) {
            return has(haystack, needle);
        }

        return {
            'register': register,
            'check': check,
            'has': has,
            'is_in': is_in
        }
    });
