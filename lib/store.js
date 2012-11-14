/** lib/store.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var path=require('path');
var fs=require('fs');

var ext='.json';
var storepath=path.join(__dirname,'store');

exports.load=function(name)
{
    //prevent users from loading files in arbitrary directories
    if (name.indexOf('..')>-1)
        return;

    var filepath=path.join(storepath,name)+ext;

    //todo: figure out a way to make this asynchronous
    if (fs.existsSync(filepath))
        return require(filepath);

    return null;
}
