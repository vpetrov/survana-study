/** Notes:
 * s-inline : can only inline input boxes
 * @type {*}
 */
var etree=require('elementtree');
var ElementTree=etree.ElementTree;
var Element=etree.Element;
var SubElement=etree.SubElement;
var util=require('util');
var autil=require('../lib/util');
var html=require('./html');

/** Generates an HTML element
 * Call type 1: element('div','text value',{'attr1':'value','attr2':value});
 * Call type 2: element({'tag':'div','html':'text value','attr1':'value','attr2':'value'});
 * @param obj
 * @param extra
 * @param extra2
 * @return {*}
 */
exports.element=function(obj,extra,extra2)
{
    var result=html.element(obj,extra,extra2);

    //return the new element
    return result;
}

exports.label=function(obj,for_element)
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
            'for':  (for_element)?for_element.get('id'):undefined
        });

    return this.element(opt);
}

/** direction: horizontal or vertical (default)*
 *  cel: container element: div or li (default)
 */
exports.field=function(obj,opt)
{
    var label=autil.extract(opt,'label',null);
    var direction=autil.extract(opt,'direction','vertical');
    var container=autil.extract(opt,'container');
    var enable_fieldset=autil.extract(opt,'fieldset',true);
    var inline_fieldset=autil.extract(opt,'s-inline',false);

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
        };

        if (inline_fieldset)
            fieldset_opt['class']='os-ui-inline';

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

exports.append=function(container,obj,createCallback)
{
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

exports.hfield=function(obj,label)
{
    return this.field(obj,{
        'label':label,
        'direction':'horizontal'
    });
}

exports.input=function(obj)
{
    //extract all extra properties, before creating the input element
    var inner=autil.extract(obj,'inner');
    var label=autil.extract(obj,'label');
    var suffix=autil.extract(obj,'suffix');
    var embedded=autil.extract(obj,'s-embedded',false);
    var inline=autil.extract(obj,'s-inline',false);

    var opt={
        'tag':      'input',
        'type':     'text',
        'tabindex': this.tabindex++
    };

    autil.override(opt,obj);

    autil.tryset(opt,'id','name');

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
            var result=null;
            var opt=null;

            //create label from obj
            if (typeof(obj)==='object')
            {
                opt=obj;

                if (typeof(opt['class'])==='undefined')
                    opt['class']='os-ui-suffix';
                else
                    opt['class']+=' os-ui-suffix';
            }
            //create label from string
            else
                opt={
                    'html':obj,
                    'class':'os-ui-suffix'
                }

            return this.label(opt);

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
        return this.field(elements,{
            'label':label,
            's-inline':inline
        });
}

exports.number=function(obj)
{
    var opt={
        'type':     'number',
        'class':    'os-ui-number',
        'data-theme':   this.theme.input
    };

    autil.override(opt,obj);

    return this.input(opt);
}

exports.radio=function(obj)
{
    var opt={
        'tag':          'input',
        'type':         'radio',
        'data-theme':   this.theme.radio,
        'tabindex':     this.tabindex++
    };

    autil.override(opt,obj);

    return this.element(opt);
}

exports.radiogroup=function(obj)
{
    var opt={
        'name':autil.uniqId('radio')
    };

    var items=autil.extract(obj,'items',[]);
    var label=autil.extract(obj,'label');
    var id=autil.extract(obj,'id');
    var direction=autil.extract(obj,'direction','horizontal',function(d){
        return d.toLowerCase();
    });

    autil.override(opt,obj);

    var fields=[];
    var i=0;

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
                    'id':   opt['name']+(i++),
                    'value':obj
                };
                var rgopt=opt;
                autil.override(rgopt,ropt);

                var radio=this.radio(rgopt);
                var radiolabel=this.label(rlabel,radio);

                return [radiolabel,radio];
            });
        }

        return result;
    });

    return this.field(fields,{
        'label':label,
        'direction':direction
    });
}

exports.question=function(obj)
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

exports.text=function(obj)
{
    var opt={
        'type':         'text',
        'value':        undefined,
        'label':        ' ',
        'data-theme':   this.theme.input,
        'class':        'os-ui-text',
        'inner':        {
            'tag':  'div',
            'class':'os-ui-container-text'
        }
    };

    autil.override(opt,obj);

    return this.input(opt);
}

exports.container=function(obj)
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
            'class':'os-ui-container-container'
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

exports.checkbox=function(obj)
{
    var opt={
        'tag':  'input',
        'type': 'checkbox',
        'data-theme':   this.theme.check,
        'tabindex': this.tabindex++
    };

    autil.override(opt,obj);

    return this.element(opt);
}

exports.checkboxgroup=function(obj)
{
    var items=autil.extract(obj,'items',[]);
    var id_prefix=autil.extract(obj,'id_prefix');
    var name_prefix=autil.extract(obj,'name_prefix');
    var label=autil.extract(obj,'label');
    var cbg_id=autil.extract(obj,'id');

    var elements=[];
    var i=0;

    this.append(elements,items,function(obj1){
        var result=[];

        for (var clabel in obj1)
        {
            var value=obj1[clabel];

            this.append(result,value,function(obj2){
                var id=null;
                var name=null;
                var value=obj2;

                if (typeof(obj2)!=='object')
                {
                    if (id_prefix)
                        id=id_prefix+(i+1);
                    if (name_prefix)
                        name=name_prefix+(i+1);

                }
                //custom objects? let this.append handle those
                else if (typeof(obj2['s-type'])!=='undefined')
                {
                    this.append(result,obj2);
                    return;
                }
                else
                {
                    id=obj2['id'];
                    name=obj2['name'];
                    value=obj2['value'];
                }

                var opt={
                    'id':id,
                    'name':name,
                    'value':value
                };

                autil.override(opt,obj);

                var check=this.checkbox(opt);
                var checklabel=this.label(clabel,check);

                ++i;

                return [checklabel,check];
            });
        }

        return result;
    });


    return this.field(elements,{
        'label':label
    });
}

exports.stype=function(obj)
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
        else
        {
            //give up at this point
            console.error('SType: Don\'t know what to do with this object:',obj);
        }
    }

    var stype=autil.extract(obj,'s-type');

    if (typeof this[stype] === 'undefined')
        throw Error('Unsupported SType "'+stype+'" declared by object with label: '+obj.label);

    //call the stype handler
    return this[stype](obj);
};

exports.form=function(obj)
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
        'data-theme':this.theme.form,
        'data-divider-theme':this.theme.question
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

exports.toHTML=function(obj,theme)
{
    this.tabindex=1;
    this.theme=theme;

    var form=this.form(obj);
    var html=new ElementTree(form);

    //return 'xhtml'
    return html.write({
       'xml_declaration':false
    });
};
