/** lib/depend.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var autil=require('./util');
var util=require('util');

var UNKNOWN=0;
var UNARY=1;
var BINARY=2;
var FUNCTION=3;

function dep(obj)
{
    var result={};

    //skip undefined/null params
    if (typeof(obj)!=='object')
        return result;

    //handle arrays
    if (util.isArray(obj))
    {
        for (var i=0;i<obj.length;++i)
            autil.override(result,dep(obj[i]));

        return result;
    }

    //only objects are allowed beyond this point

    //try to get an identifier for the field which is supposed to have dependencies
    var id=obj['name'] || obj['id'] || obj['s-id'];

    if (id)
    {
        var dependencies=autil.extract(obj,'s-depend',null);
        result[id]=dependencies;
    }

    //iterate over each property of the object (because for radiogroups/checkboxes, a property may specify a field)
    for (var i in obj)
        result=autil.override(result,dep(obj[i])); //conflicting dependencies are resolved by overwriting the older value

    return result;
}

/** Returns an object of the form:  { 'field' : {dependencies} }
 * @param fields
 * @return {Object} An object with all form field definitions that may specify dependencies
 */
exports.get=function(fields)
{
    return dep(fields);
}

exports.actions=function(source,action_list)
{
    if (!action_list)
        return "";

    if (!util.isArray(action_list))
        action_list=[action_list];

    return "Survana.dependAction('"+source+"',"+JSON.stringify(action_list)+")";


}

exports.arg=function(a)
{
    if (util.isArray(a))
        return JSON.stringify(a);

    switch (typeof(a))
    {
        case 'object':  //some value
                        if (typeof(a['value'])!=='undefined')
                        {
                            //todo: not sure what to do with object values
                            //JSON.stringify ensures that a string value will be quoted
                            return JSON.stringify(a['value']);
                        }

                        //reference to another field
                        if (typeof(a['ref'])!=='undefined')
                            return "data['"+a['ref']+"']"
                        break;

        case 'string': return JSON.stringify(a);

        default: return a;

    }

    return null;
}
exports.op=function(name,op,val)
{
    var result="";
    var opkind=UNKNOWN;

    //arg1 is a reference to a field name
    var arg1=this.arg({
        'ref':name
    });
    var operator=null;
    var arg2=this.arg(val);
    var cast=null;

    switch (op)
    {
        case '=':   operator    =   '===';
                    cast='String';
                    opkind=BINARY;
                    break;
        case '!=':  operator    =   '!==';
                    cast='String';
                    opkind=BINARY;
                    break;
        case '>':   operator    =   '>';
                    cast='Number';
                    opkind=BINARY;
                    break;
        case '<':   operator    =   '<';
                    cast='Number';
                    opkind=BINARY;
                    break;
        case '>=':  operator    =   '>=';
                    cast='Number';
                    opkind=BINARY;
                    break;
        case '<=':  operator    =   '<=';
                    cast='Number';
                    opkind=BINARY;
                    break;
        case 'has': operator    =   'Survana.Depend.has';
                    opkind=FUNCTION;
                    break;
        case 'in':  operator    =   'Survana.Depend.is_in';
                    opkind=FUNCTION;
                    break;
        /*todo: if you extend this to handle 'test' recursively, you must return a list of fields that are being used in
                conditions (see this.test()) */
        default: throw Error('depend: Unknown operator: \''+op+'\'');
    }

    if (cast)
    {
        arg1=cast+'('+arg1+')';
        arg2=cast+'('+arg2+')';
    }

    switch (opkind)
    {
        case BINARY:    result=arg1+' '+operator+' '+arg2;
                        break;
        case FUNCTION:  result=operator+'(('+arg1+'),('+arg2+'))';
                        break;
    }

    return result;
}

exports.expr=function(name,x)
{
    var result=[];

    for (var op in x)
    {
        var val=x[op];

        //convert 4 into {'value':4}
        if (typeof(val)!=='object')
        {
            val={
                'value':val
            }
        }

        result.push(this.op(name,op,val));
    }

    if (!result.length)
        return "";

    return '('+result.join(' && ')+')';
}

exports.field=function(name,exprs)
{
    var result=[];
    for (var i in exprs)
    {
        var expr=exprs[i];

        //convert {'field':4}, into {'field': { '=':4 } }
        if (typeof(expr)!=='object')
        {
            expr={
                '=':expr
            };
        }

        result.push(this.expr(name,expr));
    }

    if (!result.length)
        return "";

    return '('+result.join(' && ')+')';
}

exports.test=function(conditions)
{
    var result=[];
    var fields=[];

    for (var i in conditions)
    {
        var cond=conditions[i];

        //iterate over each field name
        for (var f in cond)
        {
            fields.push(f);
            var exprs=cond[f];

            //make sure each field has an array of boolean expressions
            if (!util.isArray(exprs))
                exprs=[exprs];

            //generate code for each dependent field
            result.push(this.field(f,exprs));
        }
    }

    if (!result.length)
        return "";

    //join test strings, cast to boolean
    return {
        'fields':fields,
        'code':"("+result.join(" || ")+")"
    };
}

exports.dependency=function(source,dep)
{
    if (typeof(dep['test'])!=='object')
        return "";

    //extract the condition
    var cond=autil.extract(dep,'test');

    //extract true/false actions. default is to enable/disable
    var ifTrue=autil.extract(dep,'true',['enable','focus']);
    var ifFalse=autil.extract(dep,'false',['disable','blur']);

    //convert values to arrays, if appropriate
    if (!util.isArray(cond))
        cond=[cond];
    if (!util.isArray(ifTrue))
        ifTrue=[ifTrue];
    if (!util.isArray(ifFalse))
        ifFalse=[ifFalse];

    var cond_js=this.test(cond);

    if (!cond_js)
        return "";

    var result="{";

    if (cond_js.fields.length)
        result='if ('+JSON.stringify(cond_js.fields)+'.indexOf(changed)>-1) {';

        result+= 'if ('+cond_js.code+') {'+
                    this.actions(source,ifTrue)+
                '} else {'+
                    this.actions(source,ifFalse)+
                '}';

    result+="}\n";

    return result;
}

exports.sdepend=function(source,sdep)
{
    var result="";

    //iterate over all dependencies
    for (var j=0;j<sdep.length;++j)
    {
        var dep=sdep[j];

        //array within array? strange, but recurse anyway, which should flatten inner arrays
        if (util.isArray(dep))
        {
            result+=this.sdepend(source,dep)+"\n";
            continue;
        }

        //append dependency string
        result+=this.dependency(source,dep)+"\n";
    }

    return result;
}

//metajs
exports.translate=function(sdeps)
{
    var result="";

    //iterate over each s-depend object
    for (var i in sdeps)
    {
        var sdep=sdeps[i];

        //skip invalid entries
        if (!sdep || typeof(sdep)!=='object')
            continue;

        if (!util.isArray(sdep))
            sdep=[sdep];

        result+=this.sdepend(i,sdep);
    }

    return result+"\n";
};
