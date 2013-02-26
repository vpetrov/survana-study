/** adapters/html.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var etree=require('elementtree-raw');
var ElementTree=etree.ElementTree;
var Element=etree.Element;
var SubElement=etree.SubElement;
var autil=require('../lib/util');

/** Generates an HTML element
 * Call type 1: element('div','text value',{'attr1':'value','attr2':value});
 * Call type 2: element({'tag':'div','html':'text value','attr1':'value','attr2':'value'});
 * @param obj
 * @param extra
 * @param extra2
 * @return {*}
 */
exports.element=function(obj,extra,extra2,extra3)
{
    //nothing to create?
    if (autil.isElement(obj))
        return obj;

    var tag,
        html,
        attr,
        result,
        raw;

    //check for type1 call
    if (typeof obj === 'string')
    {
        tag=obj;
        html=extra;
        attr=extra2;
        raw=extra3;
    }
    //type 2
    else
    {
        tag=autil.extract(obj,'tag');
        html=autil.extract(obj,'html');
        attr=obj;
        raw=autil.extract(obj,'s-raw');
    }

    //todo:remove this
    if (typeof(tag)==='undefined')
    {
        console.log('UNDEFINED TAG',obj);
        return new Element('div');
    }

    result=new Element(tag);    //create a new HTML element with the specified tag
    result.text=html;           //assign value

    if (raw) {
        result.set('_raw', true);
    }

    //copy all attributes
    for (var aname in attr)
    {
        if ((aname.indexOf('s-')==0) || (aname === '_raw'))
            continue;

        var avalue=attr[aname];

        if (typeof(avalue)!=='undefined')
            result.set(aname,avalue);
    }

    //return the new element
    return result;
}

exports.rtf = function (obj) {
    return this.element({
        'tag':'span',
        'class': 's-rtf',
        '_raw':true,
        'html': obj.html
    });
};
