/** lib/bind.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var autil=require('./util');

exports.field=function(f)
{
    var result={};
    var id=f['name']||f['id'];

    if ((typeof(id)==='undefined') || !id)
        return this.get(f);

    if (typeof(f['s-bind'])==='undefined')
        return null;

    result[id]=f['s-bind'];

    return result;
}

exports.get=function(data)
{
    var result={};

    for (var i in data)
    {
        var field=data[i];

        if (typeof(field)!=='object')
            continue;

        autil.override(result,this.field(field));
    }

    return result;
}
