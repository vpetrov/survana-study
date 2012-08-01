var etree=require('elementtree');
var ElementTree=etree.ElementTree;
var Element=etree.Element;
var SubElement=etree.SubElement;
var util=require('util');
var autil=require('./util');

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
    //nothing to create?
    if (autil.isElement(obj))
        return obj;

    var tag=null;
    var html=null;
    var attr=null;
    var result=null;

    //check for type1 call
    if (typeof obj === 'string')
    {
        tag=obj;
        html=extra;
        attr=extra2;
    }
    //type 2
    else
    {
        tag=autil.extract(obj,'tag');
        html=autil.extract(obj,'html');
        attr=obj;
    }

    result=new Element(tag);    //create a new HTML element with the specified tag
    result.text=html;           //assign value

    //copy all attributes
    for (var aname in attr)
    {
        var avalue=attr[aname];

        if (typeof(avalue)!=='undefined')
            result.set(aname,avalue);
    }

    //return the new element
    return result;
}

exports.label=function(obj,for_element)
{
    //make sure that the for element has an id
    if ((typeof(for_element)!=='undefined') && (!for_element.get('id')))
        for_element.set('id',this.randomId());

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

exports.field=function(obj,label,type)
{
    var container_opt={
        'tag':          'div',
        'data-role':    'fieldcontain',
        'data-enhance': 'false'
    };

    var opt={
        'tag':          'fieldset',
        'data-role':    'controlgroup',
        'data-type':    type
    };

    var container=this.element(container_opt);
    var fieldset=this.element(opt);
    container.append(fieldset);

    if (label)
        fieldset.append(this.element('legend',label));

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
        //else, fallback on this.xtype() and this.element()
        else
            element=this.xtype(obj);

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
    return this.field(obj,label,'horizontal');
}

exports.input=function(obj)
{
    //extract all extra properties, before creating the input element
    var inner=autil.extract(obj,'inner');
    var label=autil.extract(obj,'label');
    var suffix=autil.extract(obj,'suffix');

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

    return this.field(elements,label);
}

exports.number=function(obj)
{
    var opt={
        'type':     'number',
        'pattern':  '\\d*',
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

    if (direction==='vertical')
        return this.field(fields,label);

    return this.hfield(fields,label);
}

exports.question=function(obj)
{
    var opt={
        'tag':  'h3',
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


    return this.field(elements,label);
}

exports.xtype=function(obj)
{
    if (typeof obj['xtype'] === 'undefined')
        return this.element(obj);

    var xtype=obj['xtype'];

    if (typeof this[xtype] === 'undefined')
        throw Error('Unsupported XType "'+xtype+'" declared by object with label: '+obj.label);

    //remove 'xtype' property
    delete obj['xtype'];

    //call the xtype handler
    return this[xtype](obj);
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

    var form=this.element(opt);

    //convert all questions
    for (var i in obj.data)
    {
        var q=obj.data[i];

        form.append(this.xtype(q));
    }

    return form;
}

exports.toHTML=function(obj,theme)
{
    this.tabindex=0;
    this.theme=theme;

    var form=this.form(obj);
    var html=new ElementTree(form);

    console.log(form);

    //return 'xhtml'
    return html.write({
       'xml_declaration':false
    });
};
