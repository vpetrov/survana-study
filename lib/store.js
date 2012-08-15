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
