/** adapters/jquery.mobile.1.3.0-beta.1.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2013, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2013, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 *
 * @note Requires elementtree 0.1.5+
 */

var etree       = require('elementtree-raw');
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
        track:      'c',
        box:        'd',
        split:      'c'
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
            //create a field container passing the element in case it defines 's-field'
            field = this.field(obj.data[i]);
            //create the actual element
            el = this._stype(obj.data[i]);
            if (el) {
                if (el.tag !== 'li') {
                    //but only if the element is not already a <li> field
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

        //if the object has an 's-group' property, it's an 's-type:group'
        if (obj['s-group'] !== undefined) {
            obj['s-type'] = 'group';
        } else if (obj['s-items'] !== undefined) {
            //if the object has an 'items' property, then we can assume it is a container
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
Adapter.prototype.element   = html.element;
Adapter.prototype.rtf       = html.rtf;

Adapter.prototype.field = function (obj) {
    "use strict";

    var pos         =   ['left', 'center', 'right'],
        border      =   autil.extract(obj, 's-border',  true),
        position    =   autil.extract(obj, 's-position'),
        custom      =   autil.extract(obj, 's-field'),
        opt         =   {
            'tag':          'li',
            'data-role':    'fieldcontain'
        };

    autil.override(opt, custom);

    //border
    if ((border === false) || (border === 'false')) {
        autil.addClass(opt, 's-no-border');
    }

    //position has to be one of the ones specified by 'pos'
    if (pos.indexOf(position) > -1) {
        autil.addClass(opt, 's-' + position);
    }

    return this.element(opt);
};

Adapter.prototype.label = function (obj, for_element) {
    "use strict";

    var opt = {
        'tag':  'label',
        's-raw': true
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

/**
 * Generates a container for a component, implementing options such as s-inline, s-block, s-align, s-maximize, s-width
 * @param obj
 * @param labelopt
 * @return {Object}
 * @private
 * @note Changes s-object and s-label
 */
Adapter.prototype._container = function (obj, labelopt) {
    "use strict";

    var inline      =   autil.extract(obj,  's-inline'),
        block       =   autil.extract(obj,  's-block'),
        align       =   autil.extract(obj,  's-align'),
        maximize    =   autil.extract(obj,  's-maximize'),
        minimize    =   autil.extract(obj,  's-minimize'),
        width       =   autil.extract(obj,  's-width'),
        exact_width =   autil.extract(obj,  's-exact-width',    false),
        item_width  =   autil.extract(obj,  's-item-width'),
        embedded    =   autil.extract(obj,  's-embedded',       false),
        ctype,
        container_opt,
        ceiling;

    //container options
    container_opt = {
        'tag':              'div'
    };

    //was s-container an object or a string?
    if (typeof obj['s-container'] === 'string') {
        //if it's a string, it must be the type of the container
        ctype = autil.extract(obj, 's-container');
    } else if (typeof obj['s-container'] === 'object') {
        //apply user options for the container
        autil.override(container_opt, autil.extract(obj,  's-container'));

        //extract the container type, to set as an addition class
        ctype = autil.extract(container_opt,  's-container-type');
    }

    //ensure it's marked as an input container
    autil.addClass(container_opt, 's-input-container');

    //set the specialized s-container class
    if (ctype) {
        autil.addClass(container_opt, 's-' + ctype + '-container');
    }

    if (inline) {
        autil.addClass(container_opt, 's-inline');
        if (labelopt) {
            autil.addClass(labelopt, 's-inline');
        }
    } else if (block) {
        if (labelopt) {
            autil.addClass(labelopt, 's-block');
        }
        if (align) {
            autil.addStyle(container_opt, 'padding-left: ' + (align + this.options.width.padding) + '%');
        }
    }

    //left align by decreasing/increasing the default widths of the <label> and <input> elements
    if (align) {
        if (labelopt) {
            autil.addStyle(labelopt, 'min-width:' + align + '%');
            autil.addClass(labelopt, 's-align');
        }

        autil.addClass(container_opt, 's-align');

        //the implementation of s-width conflicts with s-align, because s-width sets css rules for 'width', while
        //align sets 'min-width'.
        if (!width) {
            autil.addStyle(container_opt, 'min-width:' +
                           ((this.options.width.label + this.options.width.input) - align) +  '%');
        }
    }

    if (maximize) {
        autil.addClass(container_opt, 's-maximize');
    } else if (minimize) {
        autil.addClass(container_opt, 's-minimize');
    }

    if (width) {
        if (exact_width) {
            //use the width directly
            autil.addStyle(container_opt, "width:" + width);
        } else {
            //map the user's width range 0..100 to an acceptable css range
            ceiling = this.options.width.input;


            if (inline || (block && !align)) {
                //when inline or in block mode, use 100 percent of total width available (100% of <li>)
                ceiling = 100;
            } else if (labelopt && !labelopt.html) {
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

            autil.addStyle(container_opt, "width:" + ceiling + '%');
        }

        autil.addClass(container_opt, 's-width');
    }

    if (item_width) {
        item_width = parseInt(item_width, 10);

        if (item_width > 0) {
            autil.addClass(container_opt, 's-equal-' + item_width);
        }
    }

    //make sure the label has html content, otherwise it will not be rendered properly
    if (labelopt && !labelopt.html && (align || block)) {
        labelopt.html = ' ';
    }

    if (embedded) {
        autil.addClass(container_opt, 's-embedded');
    }

    return container_opt;
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
        box         =   autil.extract(obj,  's-box'),
        opt,
        label_opt,
        container_opt,
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
        'tabindex':     this.tabindex++,
        's-container':  'input'
    };

    autil.override(opt, obj);

    //add css mark
    autil.addClass(opt, 's-input');

    //<label> options
    label_opt = {
        'html': label,
        'for':  id
    };


    //was s-box specified?
    if (box) {
        opt['data-box'] = box;
        label_opt['data-box'] = box;
    }

    //if no container was defined, set a reasonable default based on the 'type' attribute
    if ((obj['s-container'] === undefined) && (opt.type)) {
        opt['s-container'] = opt.type;
    }

    //create container
    if (opt['s-container']) {
        container_opt  = this._container(opt, label_opt);
        container_el   = this.element(container_opt);
    }

    //create the elements
    if (label_opt.html) {
        label_el = this.label(label_opt);
    }

    input_el = this.element(opt);

    if (container_el) {
        container_el.append(input_el);
        return [label_el, container_el];
    }

    return [label_el, input_el];
};

Adapter.prototype.question = function (obj) {
    "use strict";

    var opt = {
        'tag':          'li',
        'data-role':    'list-divider',
        'class':        's-question',
        's-raw':         true
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
        'data-highlight': false,
        'min':          0,
        'max':          100
    },
        scale = autil.extract(obj, 's-scale'),
        elements,
        last_el,
        table,
        tbody,
        tr,
        td,
        i;

    autil.override(opt, obj);

    elements = this.input(opt);

    if (scale && scale.length) {
        last_el = elements[elements.length - 1];
        table = this.element({'tag': 'table', 'class': 's-slider-labels s-slider-label' + (scale.length - 1)});
        tbody = this.element({'tag': 'tbody'});
        tr    = this.element({'tag': 'tr'});

        for (i = 0; i < scale.length; ++i) {
            td = this.element({
                'tag': 'td',
                'html': scale[i]
            });

            tr.append(td);
        }

        tbody.append(tr);
        table.append(tbody);

        last_el.append(table);
    }

    return elements;
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
        placeholder = autil.extract(obj, 'placeholder'),
        menu        = autil.extract(obj, 's-menu',      false),
        multiple    = autil.extract(obj, 's-multiple',  false),
        box         = autil.extract(obj, 's-box'),
        item_width,
        select,
        select_opt,
        label_opt,
        label_el,
        container_opt,
        container;

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
        'tabindex':     this.tabindex++,
        's-container':  'select'
    };

    label_opt = {
        'html': label,
        'for':  id
    };

    autil.override(select_opt, obj);

    //was s-multiple specified?
    if (multiple) {
        select_opt.multiple = 'multiple';
    }

    //was s-menu or s-multiple specified?
    if (menu || multiple) {
        select_opt['data-native-menu'] = 'false';
    }

    //was s-box specified?
    if (box) {
        select_opt['data-box'] = box;
        label_opt['data-box'] = box;
    }

    if (obj['s-item-width']) {
        item_width = parseInt(obj['s-item-width'], 10);
        if (item_width < 0) {
            item_width = 0;
        }

        obj['s-item-width'] = item_width;
    }

    if (select_opt['s-container']) {
        //create the container (changes select_opt and label_opt)
        container_opt = this._container(select_opt, label_opt);
    }

    //create <select>
    select = this.element(select_opt);

    //create <label>
    label_el = this.label(label_opt);

    //add an empty option as the first item
    if (empty || placeholder) {
        items.unshift({
            's-type':   'option',
            's-label':  placeholder || ''
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
                    's-value':  obj[option_label]
                };

                this._append(options, option_opt);
            }
        }

        return options;
    });

    if (container_opt) {
        container = this.element(container_opt);
        container.append(select);
        return [label_el, container];
    }

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

Adapter.prototype.toggle = function (obj) {
    "use strict";

    var opt = {
        'data-role':        'slider',
        'data-theme':       this.options.theme.toggle,
        'data-track-theme': this.options.theme.track,
        's-items': {
            'No': 0,
            'Yes': 1
        },
        's-container-type': 'toggle'
    };

    autil.override(opt, obj);

    //remove options available for 'select', but not for 'toggle'
    delete opt['s-empty'];
    delete opt['s-minimize'];

    return this.select(opt);
};

Adapter.prototype.group = function (obj) {
    "use strict";

    var id          =   autil.extract(obj,  's-id'),
        gtype       =   autil.extract(obj,  's-group'),
        items       =   autil.extract(obj,  's-items'),
        label       =   autil.extract(obj,  's-label'),
        direction   =   autil.extract(obj,  's-direction',  'vertical'),
        fieldset,
        container,
        container_opt,
        opt,
        label_opt,
        legend,
        idc = 0;

    if (!id) {
        //generate an id based on the gtype or the string 'group'
        id = this._id(gtype || 'group');
    }

    opt = {
        'tag':          'fieldset',
        'data-role':    'controlgroup',
        'data-type':    direction,
        's-container':  'group'
    };

    autil.override(opt, obj);

    //need at least a space inside the label, in order to align the component
    if (opt['s-align'] && !label) {
        label = ' ';
    }

    label_opt = {
        'tag':  'label',
        'html': label,
        'class': 'fieldset-label'
    };

    if (opt['s-embedded']) {
        opt['data-corners'] = false;
    }

    //note opt was passed as the label opt, initially
    container_opt = this._container(opt, label_opt);

    autil.addClass(container_opt, 's-' + direction);

    fieldset = this.element(opt);

    if (label_opt.html) {
        legend   = this.element(label_opt);
    }

    if (!util.isArray(items)) {
        items = [items];
    }

    //make sure no item will have a container
    this._append(fieldset, items, function (obj) {
        var item,
            ilabel,
            cid,
            i;

        //skip non-objects
        if (typeof obj !== 'object') {
            return;
        }

        //loop through arrays
        if (util.isArray(obj)) {
            this._append(fieldset, obj);
        }

        //if it is not a generic object, let _append() handle it
        if ((obj['s-type']  !== undefined) || (obj['s-items'] !== undefined) || (obj['s-group'] !== undefined)) {
            //create an object id if necessary
            if (!obj['s-id']) {
                obj['s-id'] = id + (++idc);
            }
            //make sure the object is not wrapped in a container
            obj['s-container'] = false;
            this._append(fieldset, obj);
            return;
        }

        //otherwise, it is a collection of key:values
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (typeof (obj[i]) === 'object') {
                    obj[i]['s-embedded'] = true;
                    this._append(fieldset, obj[i]);
                } else {
                    cid = id + (++idc);
                    item = {
                        'id': cid,
                        'name': id,
                        's-type': gtype,
                        'value': obj[i],
                        's-container': false
                    };

                    ilabel = this.label({
                        "html": i,
                        "for": cid
                    });

                    this._append(fieldset, [ilabel, item]);
                }
            }
        }
    });

    //create a container and append the <fieldset> to it
    //the hope is that all the positioning/aligning options will work
    container = this.element(container_opt);
    container.append(fieldset);

    if (legend) {
        return [legend, container];
    }

    return container;
};

Adapter.prototype.radio = function (obj) {
    "use strict";
    var opt = {
        'tag':          'input',
        'type':         'radio',
        'data-theme':   this.options.theme.radio,
        'data-mini':    !this.options.mobile,
        'tabindex':     this.tabindex++,
        's-container':  'radio'
    };

    autil.override(opt, obj);

    return this.input(opt);
};

Adapter.prototype.checkbox = function (obj) {
    "use strict";
    var opt = {
        'tag':          'input',
        'type':         'checkbox',
        'data-theme':   this.options.theme.check,
        'data-mini':    !this.options.mobile,
        'tabindex':     this.tabindex++,
        's-container':  'checkbox'
    };

    autil.override(opt, obj);

    return this.input(opt);
};

Adapter.prototype.link = function (obj) {
    "use strict";

    var opt,
        link,
        container_opt,
        container;

    opt = {
        'tag':          'a'
    };

    autil.override(opt, obj);

    container_opt = this._container(opt);

    link = this.element(opt);
    container = this.element(container_opt);

    container.append(link);

    return container;
};

Adapter.prototype.box = function (obj) {
    "use strict";

    var id              =   autil.extract(obj,  's-id'),
        label           =   autil.extract(obj,  's-label'),
        items           =   autil.extract(obj,  's-items'),
        button_custom   =   autil.extract(obj,  's-button'),
        opt,
        box,
        title_opt,
        title,
        container_opt,
        container,
        button_opt,
        button;

    if (!id) {
        id = this._id('box');
    }

    opt = {
        'tag':              'ul',
        'data-box':         id,
        'data-role':        'listview',
        'data-inset':       true,
        'data-split-icon':  'delete',
        'data-mini':        !this.options.mobile,
        'data-theme':       this.options.theme.box,
        'data-divider-theme': this.options.theme.box,
        'data-split-theme': this.options.theme.split,
    };

    autil.override(opt, obj);
    box = this.element(opt);


    title_opt = {
        'tag':              'li',
        'data-role':        'list-divider',
        'html':             label
    };

    title = this.element(title_opt);

    box.append(title);

    container_opt = this._container(opt);
    container = this.element(container_opt);

    container.append(box);

    this._append(container, items, function (obj) {
        var item_container_opt = {
                'tag':      'div',
                'class':    's-box-container'
            },
            item_container = this.element(item_container_opt);

        obj['s-box'] = id;
        this._append(item_container, obj);

        container.append(item_container);
    });

    button_opt = {
        'tag':          'button',
        'type':         'button',
        'data-box':     id,
        'data-mini':    !this.options.mobile,
        'data-inline':  true,
        'data-icon':    'plus',
        'data-theme':   this.options.theme.split,
        'html':         'Add'
    };

    if (typeof button_custom === 'string') {
        button_custom = {
            'html': button_custom
        };
    }

    autil.override(button_opt, button_custom);

    button = this.element(button_opt);

    container.append(button);

    return container;
};

Adapter.prototype.textbox = function (obj) {
    "use strict";

    var opt = {
        'tag':          'textarea',
        'data-theme':   this.options.theme.input,
        'data-mini':    !this.options.mobile,
        'tabindex':     this.tabindex++,
        's-container':  'textbox',
        "html": " "
    };

    autil.override(opt, obj);

    return this.input(opt);
};
