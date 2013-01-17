/** adapters/jquery.mobile.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var etree       = require('elementtree');
var ElementTree = etree.ElementTree;
var Element     = etree.Element;
var SubElement  = etree.SubElement;
var util        = require('util');
var autil       = require('../lib/util');
var html        = require('./html');
var store       = require('../lib/store');

var defaults    = {
    mobile:   false,
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
function Adapter (options) {
    this.options = autil.merge(defaults,options);
}

module.exports=function(opt) {
    return new Adapter(opt);
}

/**
 * Takes a form defined as JSON and renders it as (X)HTML (actually XML, since there is no HTML generator atm)
 * @param obj
 * @param theme
 * @return {String} The (X)HTML representation of the JSON form
 */
Adapter.prototype.toHTML = function (obj)
{
    this.tabindex=1;

    var form=this.form(obj);
    var html=new ElementTree(form);

    //return 'xhtml'
    return html.write({
        'xml_declaration':false
    });
};

/** Generates an HTML element
 * Call type 1: element('div','text value',{'attr1':'value','attr2':value});
 * Call type 2: element({'tag':'div','html':'text value','attr1':'value','attr2':'value'});
 * @param obj
 * @param extra
 * @param extra2
 * @return {*}
 */
Adapter.prototype.element = function (obj,extra,extra2)
{
    var result=html.element(obj,extra,extra2);

    //return the new element
    return result;
}

function store_item(data,tpl)
{
    var result={};

    for (var p in tpl)
    {
        var from=tpl[p];

        if (typeof(data[from])!=='undefined')
            result[p]=data[from];
        else
            result[p]=from;
    }

    if (result)
        return result;
}

Adapter.prototype.store = function (obj)
{
    var store_name=autil.extract(obj,'s-store');
    var sort=autil.extract(obj,'s-sort');
    var item_tpl=autil.extract(obj,'s-item');

    if (!store_name)
        return;

    var result=[];

    var data=store.load(store_name);

    for (var i in data)
    {
        var item_data={
            'key':i,
            'value':data[i]
        };

        result.push(store_item(item_data,item_tpl));
    }

    return result;
}

Adapter.prototype.label=function(obj,for_element)
{
    //make sure that the for element has an id
    if ((typeof(for_element)!=='undefined') && (!for_element.get('id')))
        for_element.set('id',autil.randomId());

    var opt={
        'tag':  'label'
    };

    //label from object
    if (typeof(obj)==='object')
        autil.override(opt,obj);
    //label from string or number
    else
        autil.override(opt,{
            'html': obj,
        });

    if (opt.for === undefined ){
        opt.for =  (for_element)?for_element.get('id'):undefined;
    }

    return this.element(opt);
}

/** direction: horizontal or vertical (default)*
 *  cel: container element: div or li (default)
 */
Adapter.prototype.field=function(obj,opt)
{
    var label=autil.extract(opt,'label',null);
    var direction=autil.extract(opt,'direction','vertical');
    var container=autil.extract(opt,'container');
    var enable_fieldset=autil.extract(opt,'fieldset',true);
    var inline_fieldset=autil.extract(opt,'s-inline',false);
    var maximize_fieldset=autil.extract(opt,'s-maximize',false);
    var minimize_fieldset=autil.extract(opt,'s-minimize',false);

    var container_opt={
        'tag':          'li',
        'data-role':    'fieldcontain'
    };

    autil.override(container_opt,container);

    var container=this.element(container_opt);
    var fieldset;

    if (enable_fieldset)
    {
        var fieldset_opt={
            'tag':          'fieldset',
            'data-role':    'controlgroup',
            'data-type':    direction,
            'data-mini':    !this.options.mobile
        };

        autil.override(fieldset_opt,opt);

        if (inline_fieldset) {
            if (typeof(fieldset_opt['class'])!=='undefined')
                fieldset_opt['class']+=' os-ui-inline';
            else
                fieldset_opt['class']='os-ui-inline';
        }

        if (maximize_fieldset) {
            if (typeof(fieldset_opt['class'])!=='undefined')
                fieldset_opt['class']+=' os-ui-maximize';
            else
                fieldset_opt['class']='os-ui-maximize';
        }
        else if (minimize_fieldset) {
            if (typeof(fieldset_opt['class'])!=='undefined')
                fieldset_opt['class']+=' os-ui-minimize';
            else
                fieldset_opt['class']='os-ui-minimize';
        }

        fieldset=this.element(fieldset_opt);
        container.append(fieldset);

        if (label)
            fieldset.append(this.element('legend',label));
    }
    else
        fieldset=container;

    this.append(fieldset,obj);

    return container;
}

Adapter.prototype.append=function(container,obj,createCallback)
{
    if (typeof(obj)==='undefined')
        return;

    if (util.isArray(obj))
    {
        for (var i=0;i<obj.length;++i)
            this.append(container,obj[i],createCallback);
    }
    else
    {
        var element=null;

        //if the object is an Element, use it
        if (autil.isElement(obj))
            element=obj;
        //else, attempt to call user-specified create function
        else if (typeof(createCallback)==='function')
            element=createCallback.call(this,obj);
        //else, fallback on this.stype() and this.element()
        else
        {
            if (typeof(obj['s-embedded'])==='undefined')
                obj['s-embedded']=true;

            element=this.stype(obj);
        }

        //finally, append the element, if possible
        if (element)
        {
            if (util.isArray(element))
                this.append(container,element,createCallback); //iterate in case createCallback generates an array
            else if (autil.isElement(container))
                container.append(element);
            else if (util.isArray(container))
                container.push(element);
            else
                throw Error('Unsupported container: '+container.toString());
        }
    }
}

Adapter.prototype.hfield=function(obj,label)
{
    return this.field(obj,{
        'label':label,
        'direction':'horizontal'
    });
}

Adapter.prototype.input=function(obj)
{
    //extract all extra properties, before creating the input element
    var id=autil.extract(obj,'s-id',null);
    var inner=autil.extract(obj,'inner');
    var label=autil.extract(obj,'label');
    var suffix=autil.extract(obj,'suffix');
    var embedded=autil.extract(obj,'s-embedded',false);
    var inline=autil.extract(obj,'s-inline',false);
    var maximize=autil.extract(obj,'s-maximize',false);

    var field_opt={
        'label':label,
        's-inline':inline,
        's-maximize':maximize
    };

    autil.override(field_opt,autil.extract(obj,'s-field-opt',{}));

    //make sure there's an id
    if (!id) {
        id = autil.randomId('input');
    }

    var opt={
        'tag':      'input',
        'id':       id,
        'name':     id,
        'type':     'text',
        'data-theme':this.options.theme.input,
        'data-mini': !this.options.mobile,
        'tabindex':  this.tabindex++
    };

    autil.override(opt,obj);

    var input=this.element(opt);

    //custom container?
    if (inner)
    {
        if (!autil.isElement(inner))
            inner=this.element(inner);

        inner.append(input);
        input=inner;
    }

    var elements=[input];

    //create or append one or more elements after the input
    if (typeof(suffix)!=='undefined')
    {
        //append suffix to elements, specify create callback
        this.append(elements,suffix,function(obj){

            if (typeof(obj)==="object")
                this.append(elements,obj);
            else
            {
                obj={
                    "html":obj,
                    "class":"os-ui-suffix"
                };

                return this.label(obj);
            }
        });
    }

    if (embedded)
    {
        var container=this.element({
            'tag':'div',
            'class':'os-ui-container'
        });

        this.append(container,elements);

        return container;
    }
    else
        return this.field(elements,field_opt);
}

Adapter.prototype.number=function(obj)
{
    //the controlgroup 'div' element is created by jqm in the browser, and we need to make the element be displayed
    //inline. the only way I found to do that, is to attach a class to the parent, which happens to be a fieldset,
    //so this is passing a special class for the fieldset and the css file defines rules for the controlgroup 'div'
    //that is a child of the fieldset.
    var opt={
        'type':     'number',
        'class':    'os-ui-number',
        's-field-opt': {
            'class': 'os-ui-number-container'
        }
    };

    autil.override(opt,obj);

    return this.input(opt);
}


Adapter.prototype.slider=function(obj)
{
    var opt={
        'type':         'range',
        'class':        'os-ui-number',
        'data-mini':    !this.options.mobile,
        'min':          0,
        'max':          100
    };

    autil.override(opt,obj);

    return this.input(opt)
}

Adapter.prototype.radio=function(obj)
{
    var opt={
        'tag':          'input',
        'type':         'radio',
        'data-theme':   this.options.theme.radio,
        'data-mini':    !this.options.mobile,
        'tabindex':     this.tabindex++
    };

    autil.override(opt,obj);

    return this.element(opt);
}

Adapter.prototype.radiogroup=function(obj)
{
    var id          =autil.extract(obj, 's-id',    null);
    var items       =autil.extract(obj, 'items',    []);
    var label       =autil.extract(obj, 'label');
    var direction   =autil.extract(obj,
                                   'direction',
                                   'horizontal',
                                   function (d) {
                                       return d.toLowerCase();
                                   });
    var inline      =autil.extract(obj, 's-inline',false);
    var maximize    =autil.extract(obj, 's-maximize',false);
    var minimize    =autil.extract(obj, 's-minimize',false);
    var width       =autil.extract(obj, 's-width',false);

    //make sure there's an id
    if (!id) {
        id = autil.uniqId('radio');
    }

    var opt = {
        'name': id
    };

    autil.override(opt,obj);

    var fields=[];
    var i=1;

    this.append(fields,items,function(obj){
        var result=[];

        for (var rlabel in obj)
        {
            var value=obj[rlabel];

            //handle arrays,elements, etc
            this.append(result,value,function(obj){
                //custom objects? let this.append handle those
                if (typeof(obj)==='object')
                {
                    this.append(result,obj);
                    return;
                }

                //create radio elements
                var ropt={
                    'id':   id + (i++),
                    'value':obj
                };

                var rgopt=opt;
                autil.override(rgopt,ropt);

                var rlabelopt = {
                    'html': rlabel
                };

                //allow the user to specify an explicit width (to make all buttons the same size)
                if (width) {
                    rlabelopt.style = 'width:'+width+'px';
                }

                var radio=this.radio(rgopt);
                var radiolabel=this.label(rlabelopt,radio);

                return [radiolabel,radio];
            });
        }

        return result;
    });

    return this.field(fields,{
        'label':        label,
        'direction':    direction,
        's-inline':     inline,
        's-maximize':   maximize,
        's-minimize':   minimize,
        'class':        'os-ui-radiogroup os-ui-'+direction
    });
}

Adapter.prototype.question=function(obj)
{
    var opt={
        'tag':  'li',
        'data-role':'list-divider',
        'class':'os-ui-question'
    };

    if (typeof(obj)==='object')
        autil.override(opt,obj);
    else
        opt['html']=obj;

    return this.element(opt);
}

Adapter.prototype.text=function(obj)
{
    var opt={
        'type':         'text',
        'value':        undefined,
        'label':        ' ',
        'class':        'os-ui-text',
        'inner':        {
            'tag':  'div',
            'class':'os-ui-container-text'
        }
    };

    autil.override(opt,obj);

    return this.input(opt);
}

Adapter.prototype.container=function(obj)
{
    var items=autil.extract(obj,'items',[]);

    //prevent container items from being treated as embedded fields,
    //as jquery won't render them properly
    for (var i in items)
        if (typeof(items[i]['s-embedded'])==='undefined')
            items[i]['s-embedded']=false;

    var cel=this.element({
        'tag':'ul',
        'class':'os-ui-field-container'
    });

    this.append(cel,items);

    //this div is used to prevent the container from being treated as
    //an embedded list by jquery mobile
    var buffer=this.element({
        tag:'div'
    });

    buffer.append(cel);

    var field=this.field(buffer,{
        'fieldset':false,
        'container':{
            'class':'os-ui-container-container',
            'style':obj.style || undefined
        }
    });

    if (obj['s-embedded'])
    {
        var buffer2=this.element({
            'tag':'ul',
            'class':'os-ui-field-container'
        });

        buffer2.append(field);
        return buffer2;
    }

    return field;
}

Adapter.prototype.option=function(obj)
{
    var label=autil.extract(obj,'s-label','');
    var value=autil.extract(obj,'s-value','');
    var opt={
        'tag':'option',
        'html':label,
        'value':value
    };

    autil.override(opt,obj);

    return this.element(opt);
}

Adapter.prototype.optgroup=function(obj)
{
    var label=autil.extract(obj,'s-label','');
    var items=autil.extract(obj,'items',[]);

    var opt={
        'tag':'optgroup',
        'label':label
    };

    autil.override(opt,obj);

    var result=this.element(opt);

    this.append(result,items,function(obj){
        if (typeof(obj['s-type'])!=='undefined')
        {
            this.append(result,obj);
            return;
        }

        var options=[];

        for (var i in obj)
        {
            var label=i;
            var value=obj[i];

            var oopt={
                's-type':'option',
                's-label':i,
                "s-value":value
            }

            this.append(options,oopt);
        }

        return options;
    });

    return result;
}

Adapter.prototype.select=function(obj)
{
    var id          = autil.extract(obj, 's-id',        null);
    var items       = autil.extract(obj, 'items',       []);
    var label       = autil.extract(obj, 'label');
    var empty       = autil.extract(obj, 's-empty',     false);
    var inline      = autil.extract(obj, 's-inline',    false);
    var maximize    = autil.extract(obj, 's-maximize',  false);
    var minimize    = autil.extract(obj, 's-minimize',  false);

    //make sure there's an id
    if (!id) {
        id = autil.randomId('select');
    }

    var opt={
        'id':           id,
        'name':         id,
        'tag':          'select',
        'data-theme':   this.options.theme.select,
        'data-mini':    !this.options.mobile,
        'tabindex':     this.tabindex++
    };

    autil.override(opt,obj);

    var select=this.element(opt);

    if (empty)
    {
        items.unshift({
            's-type':'option',
            's-label':''
        });
    }

    this.append(select,items,function(obj){
        if (typeof(obj['s-type'])!=='undefined')
        {
            this.append(select,obj);
            return;
        }

        var options=[];

        for (var i in obj)
        {
            var label=i;
            var value=obj[i];

            var oopt={
                's-type':'option',
                's-label':i,
                "s-value":value
            }

            this.append(options,oopt);
        }

        return options;
    });

    return this.field(select,{
        'label':label,
        's-maximize':maximize,
        's-minimize':minimize,
        's-inline':inline
    });
}


Adapter.prototype.toggle=function(obj)
{
    var opt = {
        'data-role':'slider',
        'data-theme': this.options.theme.toggle,
        'data-track-theme': this.options.theme.track,
        'items': {
            'No': 0,
            'Yes': 1
        }
    };

    autil.override(opt,obj);

    var result= this.select(opt);

    console.log(result);
    return result;
}

Adapter.prototype.checkbox=function(obj)
{
    var opt={
        'tag':          'input',
        'type':         'checkbox',
        'data-theme':   this.options.theme.check,
        'tabindex':     this.tabindex++,
        'data-mini':    !this.options.mobile
    };

    autil.override(opt,obj);

    return this.element(opt);
}

Adapter.prototype.checkboxgroup=function(obj)
{
    var id          = autil.extract(obj,'s-id',         null);
    var items       = autil.extract(obj,'items',        []);
    var label       = autil.extract(obj,'label');
    var inline      = autil.extract(obj,'s-inline',     false);
    var maximize    = autil.extract(obj,'s-maximize',   false);
    var minimize    = autil.extract(obj,'s-minimize',   false);
    var direction   = autil.extract(obj,'direction',    'vertical');
    var width       = autil.extract(obj,'s-width',      false);
    var elements=[];
    var i=0;

    if (!id) {
        id = autil.randomId('check');
    }

    this.append(elements,items,function(obj1){
        var result=[];

        for (var clabel in obj1)
        {
            var value=obj1[clabel];

            this.append(result,value,function(obj2){
                var cid=null;
                var name=null;
                var value=obj2;

                //custom objects? let this.append handle those
                if (typeof(obj2['s-type'])!=='undefined')
                {
                    this.append(result,obj2);
                    return;
                }
                else if (typeof(obj2)==="object")
                {
                    cid=obj2['id'];
                    name=obj2['name'];
                    value=obj2['value'];
                }

                //no id?
                if (!cid) {
                    cid = id + (i+1);
                }

                var opt={
                    'id':   cid,
                    'name': name || id,
                    'value':value
                };

                autil.override(opt,obj);

                var clabelopt = {
                    'html': clabel
                };

                //allow the user to specify an explicit width (to make all buttons the same size)
                if (width) {
                    clabelopt.style = 'width:'+width+'px';
                }

                var check=this.checkbox(opt);
                var checklabel=this.label(clabelopt,check);

                ++i;

                return [checklabel,check];
            });
        }

        return result;
    });


    return this.field(elements,{
        'label':        label,
        'direction':    direction,
        's-inline':     inline,
        's-maximize':   maximize,
        's-minimize':   minimize,
        'class':        'os-ui-checkboxgroup os-ui-'+direction
    });
}

Adapter.prototype.stype=function(obj)
{
    //does this object have an s-type property?
    if (typeof obj['s-type'] === 'undefined')
    {
        //does it have an HTML tag?
        if (typeof(obj['tag'])!=='undefined')
            return this.element(obj);

        //if the object has an 'items' property, then we can assume it is a container
        if (typeof(obj['items'])!=='undefined')
            obj['s-type']='container';
        //if the object has an 's-store' property, then its stype should be 'store'
        else if (typeof(obj['s-store'])!=='undefined')
            obj['s-type']='store';
        else
            //give up at this point
            console.error('SType: Don\'t know what to do with this object:',obj);
    }

    var stype=autil.extract(obj,'s-type');

    if (typeof this[stype] === 'undefined')
        return null; //ignore unknown s-types

    //call the stype handler
    return this[stype](obj);
};

Adapter.prototype.form=function(obj)
{
    var opt={
        'tag':          'form',
        'id':           obj.id,
        'action':       '?',        //unused
        'method':       'post',     //unused
        'data-form':    obj.code,
        'data-version': obj.version
    };

    var list={
        'tag':'ul',
        'data-role':'listview',
        'data-inset':'true',
        'data-theme':this.options.theme.form,
        'data-divider-theme':this.options.theme.question
    };

    var form=this.element(opt);
    var list=this.element(list);

    form.append(list);

    //convert all questions
    for (var i in obj.data)
    {
        var q=obj.data[i];

        var xel=this.stype(q);

        if (xel)
            list.append(xel);
    }

    return form;
}
