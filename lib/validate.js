/** lib/validate.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var util    = require('util'),
    autil   = require('./util');

exports.field = function (f) {
    "use strict";

    var result  =   {},
        id      = f.name || f.id || f['s-id'],
        value,
        i;

    if ((id === undefined) || !id) {
        return this.get(f);
    }

    result[id] = {};

    //iterate over all properties of the field
    for (i in f) {
        if (f.hasOwnProperty(i)) {
            value = f[i];

            switch (i) {
            //repurpose some html attributes, for convenience
            case 'min':
            case 'max':
            case 'maxlength':
                if (typeof (value) !== 'object') {
                    result[id][i] = value;
                }
                break;
            case 'type':
                switch (value) {
                case 'email':
                case 'url':
                case 'number':
                    result[id][value] = true;
                    break;
                }
                break;
            case 's-validate':
                //merge validation with custom attributes
                result[id] = autil.override(result[id], value);
                break;

            default://recursively search for fields
                if (typeof (value) === 'object') {
                    autil.override(result, this.field(value));
                }
            }
        }
    }

    return result;
};

exports.get = function (data) {
    "use strict";

    var result = {},
        field,
        i;

    for (i in data) {
        if (data.hasOwnProperty(i)) {
            field = data[i];

            if (typeof (field) === 'object') {
                autil.override(result, this.field(field));
            }
        }
    }

    return result;
};
