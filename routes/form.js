/** routes/form.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var async = require('async');
var path = require('path');
var depend = require('../lib/depend');
var validate = require('../lib/validate');
var bind = require('../lib/bind');

/**
 * GET form preview
 */
exports.preview = function (req, res, next) {
    "use strict";

    var app     = req.app,
        db      = app.db,
        config  = app.config,
        form,
        adapter,
        dep,
        dep_js,
        rules,
        bindings,
        html,
        opt;

    if (!req.body || !req.body.form) {
        return next(new Error('Invalid request'));
    }

    try {
        form = JSON.parse(req.body.form);
    } catch (err) {
        return next(err);
    }

    if (!form.id) {
        return next(new Error('Invalid form data'));
    }

    //load appropriate adapter, from module root
    if (req.mobile) {
        adapter = require(path.join(app.dirname, config.adapters.mobile))({
            'theme': config.theme,
            'mobile': true
        });
    } else {
        adapter = require(path.join(app.dirname, config.adapters.desktop))({
            'theme': config.theme,
            'mobile': false
        });
    }

    //compute field dependencies
    dep = depend.get(form.data);
    //translate dependencies to javascript
    dep_js = depend.translate(dep);
    rules = validate.get(form.data);
    bindings = bind.get(form.data);
    html = adapter.toHTML(form);

    opt = {
        form:               form,
        mobile:             req.mobile,
        dep:                dep,
        dep_js:             dep_js,
        validation_rules:   rules,
        bindings:           bindings,
        html:               html,
        layout:             '../form'
    };

    res.render(req.views + 'form/preview', opt);
};
