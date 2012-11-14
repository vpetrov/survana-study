/** adapters/jquery.mobile.mini.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var jqm=require('./jquery.mobile');

//todo: this file needs inheritance, instead of delegation

exports.minify=function(obj)
{
    if (typeof(obj['data-mini'])==='undefined')
        obj['data-mini']='true';
}
exports.element=jqm.element;
exports.store=jqm.store;
exports.label=jqm.label;
exports.field=function(obj,label,type)
{
    this.minify(obj);
    return jqm.field.apply(this,arguments);
}
exports.hfield=jqm.hfield;
exports.append=jqm.append;
exports.input=function(obj)
{
    this.minify(obj);

    return jqm.input.apply(this,arguments);
}
exports.number=jqm.number;
exports.radio=function(obj)
{
    this.minify(obj);
    return jqm.radio.apply(this,arguments);
}
exports.container=jqm.container;
exports.radiogroup=function(obj)
{
    this.minify(obj);
    return jqm.radiogroup.apply(this,arguments);
}
exports.question=jqm.question;
exports.text=jqm.text;
exports.checkbox=function(obj)
{
    this.minify(obj);
    return jqm.checkbox.apply(this,arguments);
}
exports.checkboxgroup=jqm.checkboxgroup;
exports.option=jqm.option;
exports.optgroup=jqm.optgroup;
exports.select=function(obj)
{
    this.minify(obj);
    return jqm.select.apply(this,arguments);
}
exports.stype=jqm.stype;
exports.form=jqm.form;
exports.toHTML=function(obj,theme)
{
    return jqm.toHTML.apply(this,arguments);
}
