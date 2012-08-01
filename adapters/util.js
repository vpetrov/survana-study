exports.override=function(obj1,obj2)
{
    if ((typeof obj1 === 'undefined') ||
        (typeof obj2 === 'undefined'))
        return obj1||obj2;

    //override properties of obj1
    for (var i in obj2)
        obj1[i]=obj2[i];

    return obj1;
}

exports.extract=function(obj,property,default_value,callback)
{
    if (typeof(obj[property])==='undefined')
        return default_value;

    var result=obj[property];
    delete obj[property];

    if (typeof(callback)==='function')
        callback.call(this,result,obj);

    return result;
}

/** Attempts to copy an property of an object into another property of the same object
 * @param {Object}  obj     The object
 * @param {String}  from    The source element key
 * @param {String}  to      The target element key
 */
exports.tryset=function(obj, from, to)
{
    if (typeof(obj[from])==='undefined')
        return;

    if (typeof(obj[to])==='undefined')
        return;

    obj[to]=obj[from];
}

exports.randomId=function(prefix)
{
    if (typeof(prefix)==='undefined')
        prefix='__el';

    return prefix+(Math.floor(Math.random()*10000));
}

exports.uniqId=function(prefix)
{
    if (typeof(prefix)==='undefined')
        prefix=this.randomId();

    return prefix+(new Date()).valueOf();
}

exports.isElement=function(obj)
{
    return (typeof(obj)==='object') &&
           (typeof(obj['_id'])!=='undefined') &&
           (typeof(obj['_children'])!=='undefined');
}
