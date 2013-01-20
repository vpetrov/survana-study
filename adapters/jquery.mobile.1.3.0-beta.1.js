/** adapters/jquery.mobile.1.3.0-beta.1.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2013, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2013, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 *
 * @note Requires elementtree 0.1.5+
 */

var etree       = require('elementtree');
var ElementTree = etree.ElementTree;
var Element     = etree.Element;
var util        = require('util');
var autil       = require('../lib/util');
var html        = require('./html');
var store       = require('../lib/store');

var defaults    = {
    mobile:   false,
    width: {
        label:  20,
        input:  78,
        padding: 2
    },
    theme:  {
        input:      'b',
        radio:      'b',
        check:      'b',
        select:     'c',
        form:       'b',
        question:   'b',
        toggle:     'c',
        track:      'c'
    }
};

/**
 * The Adapter class.
 * @param options
 * @constructor
 * @see toHTML()
 */
function Adapter(options) {
    "use strict";

    this.options = autil.merge(defaults, options);
}

module.exports = function (opt) {
    "use strict";

    return new Adapter(opt);
};

Adapter.prototype._id = function (prefix) {
    "use strict";

    if (prefix === undefined) {
        prefix = "__element";
    }

    this.nextId += 1;

    return String(prefix) + this.nextId;
};

/**
 * Takes a form defined as JSON and renders it as (X)HTML
 * @param   obj      A JSON description of the form to generate
 * @return  {String} The (X)HTML representation of the JSON form
 */
Adapter.prototype.toHTML = function (obj) {
    "use strict";

    var form, xhtml;

    // reset counters
    this.tabindex = 1;
    this.nextId = 0;

    // top level element is always a <form>
    form = this.form(obj);

    console.log(form);

    // translate JSON to XML
    xhtml = new ElementTree(form);

    console.log(xhtml.write({
        'xml_declaration': false,
        'indent': true
    }));

    // return 'xhtml'
    return xhtml.write({
        'xml_declaration': false
    });
};

/**
 * Generates a <form> element, and parses its children recursively
 * @param   obj     {Object}        JSON description of the form
 * @return  {Object}                Object representation of all HTML elements that make up this form
 */
Adapter.prototype.form = function (obj) {
    "use strict";

    var opt = {
            'tag':          'form',
            'id':           obj.id,
            'action':       '?',        //unused
            'method':       'post',     //unused
            'data-form':    obj.code,
            'data-version': obj.version
        },
        listopt = {
            'tag':                  'ul',
            'data-role':            'listview',
            'data-inset':           'true',
            'data-theme':           this.options.theme.form,
            'data-divider-theme':   this.options.theme.question
        },
        form,
        list,
        i,
        el,
        field;

    //create the form and the <ul> list
    form = this.element(opt);
    list = this.element(listopt);

    //append the <ul> to the <form>
    form.append(list);

    //ensure 'data' is an array
    if (!util.isArray(obj.data)) {
        obj.data = [obj.data];
    }

    //recursively convert all questions
    for (i = 0; i < obj.data.length; i += 1) {
        if (obj.data[i]) {
            el = this._stype(obj.data[i]);
            if (el) {
                //create a field container passing the element in case it defines 's-field'
                if (el.tag !== 'li') {
                    //but only if the element is not already a <li> field
                    field = this.field(el);
                    this._append(field, el);
                    list.append(field);
                } else {
                    list.append(el);
                }
            }
        }
    }

    return form;
};

/**
 * Generates an element based on it's "s-type" property
 * @param obj
 * @return {Object|Array}
 * @private
 */
Adapter.prototype._stype = function (obj) {
    "use strict";

    var stype;

    //does this object have an s-type property?
    if (obj['s-type'] === undefined) {

        //does it have an HTML tag?
        if (obj.tag !== undefined) {
            return this.element(obj);
        }

        //if the object has an 'items' property, then we can assume it is a container
        if (obj['s-items'] !== undefined) {
            obj['s-type'] = 'container';
        } else if (obj['s-store'] !== undefined) {
            //if the object has an 's-store' property, then its stype should be 'store'
            obj['s-type'] = 'store';
        } else {
            //give up at this point
            console.error("_stype: don't know what to do with this object:", obj);
        }
    }

    //check the s-type again, in case it got updated
    if (obj['s-type']) {
        stype = autil.extract(obj, 's-type');
        if (typeof this[stype] === 'function') {
            return this[stype](obj);
        }
    }

    return null;
};

/**
 * Appends 'obj' to 'container', calling _stype() or createCallback() as needed
 * @param container         Target element
 * @param obj               Source element(s)
 * @param createCallback    A callback which will be responsible for generating output for this 'obj' (or its child)
 * @private
 */
Adapter.prototype._append = function (container, obj, createCallback) {
    "use strict";

    var element,
        i;

    if (obj === undefined) {
        return;
    }

    //handle array of objects recursively
    if (util.isArray(obj)) {
        for (i = 0; i < obj.length; ++i) {
            this._append(container, obj[i], createCallback);
        }
    } else {
        //if the object is an Element, use it
        if (autil.isElement(obj)) {
            element = obj;
        } else if (typeof createCallback === 'function') {
            //else, attempt to call user-specified 'create' function
            element = createCallback.call(this, obj);
        } else if (obj && (typeof obj === 'object')) {
            //fallback on this.stype() and this.element()
            if (obj['s-embedded'] !== undefined) {
                obj['s-embedded'] = true;
            }

            element = this._stype(obj);
        }

        //finally, append the element, if possible
        if (element) {
            if (util.isArray(element)) {
                //iterate in case createCallback generates an array
                this._append(container, element, createCallback);
            } else if (autil.isElement(container)) {
                container.append(element);
            } else if (util.isArray(container)) {
                container.push(element);
            } else {
                throw new Error('Unsupported container: ' + container.toString());
            }
        }
    }
};


/** Generates an HTML element
 * Call type 1: element('div','text value',{'attr1':'value','attr2':value});
 * Call type 2: element({'tag':'div','html':'text value','attr1':'value','attr2':'value'});
 * @param obj
 * @param extra
 * @param extra2
 * @return {Object}
 */
Adapter.prototype.element = html.element;

Adapter.prototype.field = function (obj) {
    "use strict";

    var opt     = {
            'tag':          'li',
            'data-role':    'fieldcontain'
        },
        custom  =   autil.extract(obj, 's-field');

    autil.override(opt, custom);

    return this.element(opt);
};

Adapter.prototype.label = function (obj, for_element) {
    "use strict";

    var opt = {
        'tag':  'label'
    };

    //make sure that the for element has an id
    if ((for_element !== undefined) && !for_element.get('id')) {
        for_element.set('id', this._id());
    }

    //label from object
    if (typeof obj === 'object') {
        autil.override(opt, obj);
    } else {
        //label from string or number
        opt.html = obj;
    }

    //no label defined
    if (!opt.html) {
        return null;
    }

    if (opt['for'] === undefined) {
        opt['for'] = (for_element) ? for_element.get('id') : undefined;
    }

    return this.element(opt);
};

Adapter.prototype._container = function (opt) {
    "use strict";

    var obj         =   autil.extract(opt,  's-object', {}),
        labelopt    =   autil.extract(opt,  's-label',  {}),
        inline      =   autil.extract(obj,  's-inline'),
        block       =   autil.extract(obj,  's-block'),
        align       =   autil.extract(obj,  's-align'),
        maximize    =   autil.extract(obj,  's-maximize'),
        width       =   autil.extract(obj,  's-width'),
        exact_width =   autil.extract(obj,  's-exact-width',    false),
        container_opt,
        ceiling;

    //<input> container options
    container_opt = {
        'tag':      'div',
        'class':    's-input-container s-' + obj.type + '-container',
        'style':    ''
    };

    if (inline) {
        labelopt['class'] = 's-inline';
        container_opt['class'] += ' s-inline';

    } else if (block) {
        labelopt['class'] = 's-block';
        if (align) {
            container_opt.style += 'padding-left: ' + (align + this.options.width.padding) + '%;';
        }
    }

    //left align by decreasing/increasing the default widths of the <label> and <input> elements
    if (align) {
        labelopt.style = 'min-width:' + align + '%;';
        container_opt['class'] += ' s-align';

        //the implementation of s-width conflicts with s-align, because s-width sets css rules for 'width', while
        //align sets 'min-width'.
        if (!width) {
            container_opt.style += ';min-width:' +
                ((this.options.width.label + this.options.width.input) - align) +  '%;';
        }
    }

    if (maximize) {
        container_opt['class'] += ' s-maximize';
    }

    if (width) {
        if (exact_width) {
            //use the width directly
            container_opt.style += ";width:" + width + ';';
        } else {
            //map the user's width range 0..100 to an acceptable css range
            ceiling = this.options.width.input;


            if (inline || (block && !align)) {
                //when inline or in block mode, use 100 percent of total width available (100% of <li>)
                ceiling = 100;
            } else if (!labelopt.html) {
                //if no label exists, then there is more room for the input box
                ceiling += this.options.width.label + this.options.width.padding;
            } else if (align) {
                //ceiling -= align;
                ceiling = (this.options.width.label + this.options.width.input) - align;
            }

            //check user-supplied value
            if (width > 100) {
                width = 100;
            } else if (width < 1) {
                width = 1;
            }

            //reuse 'ceiling' for the new adjusted value of 'width'
            ceiling = (width * ceiling) / 100;

            container_opt.style += ";width:" + ceiling + '%;';
        }

        container_opt['class'] += ' s-width';
    }

    return this.element(container_opt);
};

/**
 *
 * @param obj
 * @return {Object}
 */
Adapter.prototype.input = function (obj) {
    "use strict";

    //extract all extra properties, before creating the input element
    var id          =   autil.extract(obj,  's-id'),
        label       =   autil.extract(obj,  's-label'),
        opt,
        labelopt,
        input_el,
        label_el,
        container_el;

    //make sure an id exists
    if (!id) {
        id = this._id('input');
    }

    //<input> options
    opt = {
        'tag':          'input',
        'id':           id,
        'name':         id,
        'type':         'text',
        'class':        '',
        'data-theme':   this.options.theme.input,
        'data-mini':    !this.options.mobile,
        'tabindex':     this.tabindex++
    };

    autil.override(opt, obj);

    //add css mark
    opt['class'] += ' s-input';

    //<label> options
    labelopt = {
        'html': label,
        'for':  id
    };

    //create container
    container_el  = this._container({
        's-object': opt,
        's-label': labelopt
    });

    //create the elements
    label_el = this.label(labelopt);
    input_el = this.element(opt);

    //this element enables us to control the width of the int);
    container_el.append(input_el);

    //return [label_el, input_el];
    return [label_el, container_el];
};

Adapter.prototype.question = function (obj) {
    "use strict";

    var opt = {
        'tag':          'li',
        'data-role':    'list-divider',
        'class':        's-question'
    };

    if (typeof obj === 'object') {
        autil.override(opt, obj);
    } else {
        opt.html = obj;
    }

    return this.element(opt);
};

/**
 * Generates code for a textbox
 * @param obj
 * @return {Object}
 */
Adapter.prototype.text = function (obj) {
    "use strict";

    var opt = {
        'type':         'text',
        'value':        undefined,
        'class':        's-text'
    };

    autil.override(opt, obj);

    return this.input(opt);
};

/**
 * Generates code for a number field
 * @param obj
 * @return {Object}
 */
Adapter.prototype.number = function (obj) {
    "use strict";

    var opt = {
        'type':         'number',
        'value':        undefined,
        'class':        's-number',
        's-width':      '65px',
        's-exact-width': true
    };

    if (obj['s-width']) {
        opt['s-exact-width'] = false;
    }

    autil.override(opt, obj);

    return this.input(opt);
};

/**
 * Generates a slider field
 * @param obj
 * @return {Object}
 */
Adapter.prototype.slider = function (obj) {
    "use strict";

    var opt = {
        'type':         'range',
        'class':        's-slider',
        'min':          0,
        'max':          100
    };

    autil.override(opt, obj);

    return this.input(opt);
};

/**
 * Generates a <select> element
 * @param obj
 * @return {Object}
 */
Adapter.prototype.select = function (obj) {
    "use strict";

    var id          = autil.extract(obj, 's-id',        null),
        items       = autil.extract(obj, 's-items',     []),
        label       = autil.extract(obj, 's-label'),
        empty       = autil.extract(obj, 's-empty',     false),
        inline      = autil.extract(obj, 's-inline',    false),
        maximize    = autil.extract(obj, 's-maximize',  false),
        minimize    = autil.extract(obj, 's-minimize',  false),
        align       = autil.extract(obj, 's-align'),
        width       = autil.extract(obj, 's-width'),
        select,
        select_opt,
        label_el;

    //make sure there's an id
    if (!id) {
        id = this._id('select');
    }

    //make sure items is an array
    if (!util.isArray(items)) {
        items = [items];
    }

    select_opt = {
        'id':           id,
        'name':         id,
        'tag':          'select',
        'data-theme':   this.options.theme.select,
        'data-mini':    !this.options.mobile,
        'tabindex':     this.tabindex++
    };

    autil.override(select_opt, obj);

    //create <select>
    select = this.element(select_opt);

    //create <label>
    label_el = this.label({
        'html': label,
        'for':  id
    });

    //add an empty option as the first item
    if (empty) {
        items.unshift({
            's-type':   'option',
            's-label':  ''
        });
    }

    //append all items to the select box
    this._append(select, items, function (obj) {
        var options = [],
            option_opt,
            option_label;

        if (obj['s-type'] !== undefined) {
            this._append(select, obj);
            return null;
        }

        for (option_label in obj) {
            if (obj.hasOwnProperty(option_label)) {
                option_opt = {
                    's-type':   'option',
                    's-label':  option_label,
                    "s-value":  obj[option_label]
                };

                this._append(options, option_opt);
            }
        }

        return options;
    });

    return [label_el, select];
};

Adapter.prototype.option = function (obj) {
    "use strict";

    var label = autil.extract(obj, 's-label',   ''),
        value = autil.extract(obj, 's-value',   ''),
        opt;

    opt = {
        'tag':      'option',
        'html':     label,
        'value':    value
    };

    autil.override(opt, obj);

    return this.element(opt);
};

Adapter.prototype.optgroup = function (obj) {
    "use strict";

    var label   =   autil.extract(obj,    's-label',  ''),
        items   =   autil.extract(obj,    's-items',  []),
        opt,
        optgroup_el;

    opt = {
        'tag':      'optgroup',
        'label':    label
    };

    autil.override(opt, obj);

    //create <optgroup>
    optgroup_el = this.element(opt);

    //append all options to <optgroup>
    this._append(optgroup_el, items, function (obj) {
        var options = [],
            option_label,
            option_opt;

        if (obj['s-type'] !== undefined) {
            this._append(optgroup_el, obj);
            return null;
        }

        //parse each key:value pair and generate <option> elements
        for (option_label in obj) {
            if (obj.hasOwnProperty(option_label)) {
                option_opt = {
                    's-type':   'option',
                    's-label':  option_label,
                    "s-value":  obj[option_label]
                };

                this._append(options, option_opt);
            }
        }

        return options;
    });

    return optgroup_el;
};

/**
 * Generates an Object given a key:value map and a template referring to keys in that map
 * @param data
 * @param tpl
 * @return {Object|undefined}
 * @private
 */
Adapter.prototype._store_item = function (data, tpl) {
    "use strict";

    var result = {},
        p,
        from;

    for (p in tpl) {
        if (tpl.hasOwnProperty(p)) {
            from = tpl[p];

            if (data[from] !== undefined) {
                result[p] = data[from];
            } else {
                result[p] = from;
            }
        }
    }

    if (result) {
        return result;
    }

    return undefined;
};

/**
 * Generates an array of objects given a store to load and a template for all items in the store
 * @param obj
 * @return {Array}
 */
Adapter.prototype.store = function (obj) {
    "use strict";

    var store_name  =   autil.extract(obj,  's-store'),
        sort        =   autil.extract(obj,  's-sort'),
        item_tpl    =   autil.extract(obj,  's-item'),
        result      =   [],
        data,
        item_data,
        i;

    if (!store_name) {
        return null;
    }

    data = store.load(store_name);

    for (i in data) {
        if (data.hasOwnProperty(i)) {
            item_data = {
                'key':      i,
                'value':    data[i]
            };

            result.push(this._store_item(item_data, item_tpl));
        }
    }

    return result;
};


/*
Adapter.prototype.toggle = function (obj) {
    "use strict";

    var opt = {
        'data-role':        'slider',
        'data-theme':       this.options.theme.toggle,
        'data-track-theme': this.options.theme.track,
        's-items': {
            'No': 0,
            'Yes': 1
        }
    };

    autil.override(opt, obj);

    return this.select(opt);
}; */
