/** lib/util.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

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

exports.merge=function(obj1,obj2)
{
    if ((typeof obj1 === 'undefined') ||
        (typeof obj2 === 'undefined'))
        return obj1||obj2;

    //override properties of obj1
    for (var i in obj2)
    {
        var p = obj2[i];

        //override sub-properties recursively
        if ((typeof(obj1[i])==="object") && (typeof(obj2[i])==="object")) {
            p = this.override(obj1[i],p);
        }

        obj1[i]=p;
    }

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

/** Attempts to copy a property of an object into another property of the same object
 * @param {Object}  obj     The object
 * @param {String}  from    The source element key
 * @param {String}  to      The target element key
 */
exports.tryset=function(obj, from, to)
{
    if (typeof(obj[from])==='undefined')
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
    return obj && (typeof(obj) === 'object') && ((obj._root !== undefined) || (obj._id !== undefined) && (obj._children !== undefined));
}

exports.addClass = function (obj, class_name) {
    if (obj['class'] === undefined) {
        obj['class'] = class_name;
    } else {
        obj['class'] += ' ' + class_name;
    }
};

exports.addStyle = function (obj, style) {
   if (obj.style === undefined) {
       obj.style = style;
   } else {
       obj.style += '; ' + style +';';
   }
};

exports.countProperties = function (obj) {
    var i,
        n = 0;

    if (typeof obj !== 'object') {
        return 0;
    }

    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            n++;
        }
    }

    return n;
};
