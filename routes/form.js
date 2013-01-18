/** routes/form.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var async = require('async');
var path = require('path');
var depend=require('../lib/depend');
var validate=require('../lib/validate');
var bind=require('../lib/bind');

/*
 * GET form preview
 */
exports.preview = function(req, res, next)
{
    var app=req.app;
    var db=app.db;
    var config=app.config;

    if (!req.body || !req.body['form'])
        return next(new Error('Invalid request'));

    var form;

    try
    {
        form = JSON.parse(req.body['form']);
    }
    catch (err)
    {
        return next(err);
    }

    if (!form.id)
        return next(new Error('Invalid form data'));

    var adapter=null;

    //load appropriate adapter, from module root
    if (req.mobile) {
        adapter=require(path.join(app.dirname,config.adapters.mobile))({
            'theme': config.theme,
            'mobile':true
        });
    } else {
        adapter=require(path.join(app.dirname,config.adapters.desktop))({
            'theme': config.theme,
            'mobile':false
        });
    }

    //compute field dependencies
    var dep=depend.get(form.data);

    console.log('dependencies',dep);

    //translate dependencies to javascript
    var dep_js=depend.translate(dep);
    var rules=validate.get(form.data);
    var bindings=bind.get(form.data);

    var html=adapter.toHTML(form);

    var opt={
        form:form,
        mobile:req.mobile,
        dep:dep,
        dep_js:dep_js,
        validation_rules:rules,
        bindings:bindings,
        html:html,
        layout:'../form'
    };

    res.render(req.views+'form/preview',opt);
};
