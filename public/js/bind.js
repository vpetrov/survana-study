/** public/js/bind.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define(
    [
        'jquery',
        'storage'
    ],
    function ($, Store) {
        "use strict";

        var bindings = {};

        function register(id, b) {
            bindings[id] = b;

            console.log('bindings for', id, b);
        }

        function field(form_id, f) {
            if (bindings[form_id]) {
                var id = f.attr('name') || f.attr('id'),
                    target = bindings[form_id][id];

                if (target) {
                    Store.put('s-' + target, f.val());
                }
            }
        }

        return {
            'register': register,
            'field': field
        };
    }
);
