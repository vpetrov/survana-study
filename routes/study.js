/** routes/study.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

"use strict";

var async       =   require('async'),
    path        =   require('path'),
    dbutil      =   require('../lib/db.util'),
    depend      =   require('../lib/depend'),
    validate    =   require('../lib/validate'),
    bind        =   require('../lib/bind'),
    url         =   require('url'),
    ursa        =   require('ursa');

//returns an array of objects, of the form {'id':str,'url':str}
function build_workflow(url_prefix, forms) {
    //Build the workflow
    var workflow = [],
        f;

    for (f in forms) {
        if (forms.hasOwnProperty(f)) {

            workflow.push({
                id: forms[f].id,
                url: path.join(url_prefix, forms[f].id)
            });
        }
    }

    return workflow;
}

exports.index = function (req, res, next) {

    var db = req.app.db,
        config = req.app.config,
        study_id = req.params[0],
        is_app = (req.query.app !== undefined),
        urlpath = url.parse(req.url).pathname,
        template;

    if (is_app) {
        template = req.views + 'study/app';
    } else {
        template = req.views + 'study/index';
    }


    async.waterfall([

        function getStudy(next2) {
            dbutil.getStudy(db, study_id, next2);
        },

        function prepareResult(study, next2) {
            next2(null, study);
        }
    ],
        function processResult(err, study) {
            if (err) {
                next(err);
                return;
            }

            if (!study) {
                next(new Error('Study "' + study_id + '" could not be found.'));
                return;
            }

            if (!study.keys) {
                next(new Error("No public keys could be found for this study."));
                return;
            }

            var key = study.keys[parseInt(Math.random() * 1000, 10) % study.keys.length]; //random key

            res.render(template, {
                store:      study['store-url'] || config.store,
                key:        key,
                study:      study,
                study_id:   study_id,
                server_id:  req.app.keyID,
                session_id: req.app.randomId(16),
                workflow:   build_workflow(urlpath, study.forms),
                layout:     '../layout'
            });
        });
};

exports.form = function (req, res, next) {

    var app         = req.app,
        db          = app.db,
        config      = app.config,
        study_id    = req.params[0],
        form_id     = req.params[1],
        study,
        form,
        overrides;

    async.waterfall([
        function findStudy(next2) {
            dbutil.getStudy(db, study_id, next2);
        },

        function findForm(result, next2) {
            var form,
                i;

            if (!result) {
                return next2(new Error('Study ' + study_id + 'not found.'));
            }

            study = result;

            for (i in result.forms) {
                if (result.forms.hasOwnProperty(i)) {
                    if (result.forms[i].id === form_id) {
                        form = result.forms[i];
                        if (study.overrides) {
                            overrides = study.overrides[i];
                        }
                        break;
                    }
                }
            }

            if (!form) {
                return next2(new Error('Form ' + form_id + ' not found.'));
            }

            next2(null, form);
        },

        function override(form, next2) {
            if (form && overrides) {
                obj.override(form, overrides);
            }
            next2(null, form);
        },

        function toHTML(form, next2) {
            var adapter,
                dep,
                dep_js,
                rules,
                bindings,
                html,
                opt;

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
            dep         = depend.get(form.data);
            //translate dependencies to javascript
            dep_js      = depend.translate(dep);
            rules       = validate.get(form.data);
            bindings    = bind.get(form.data);
            html        = adapter.toHTML(form);

            opt = {
                study:              study,
                store:              (form['store-url'] || study['store-url']),
                form:               form,
                mobile:             req.mobile,
                dep:                dep,
                dep_js:             dep_js,
                validation_rules:   rules,
                bindings:           bindings,
                html:               html,
                study_id:           undefined,
                layout:             '../form'
            };

            next2(null, opt);
        }
    ],
        function processResult(err, opt) {
            if (err) {
                return next(err);
            }

            return res.render(req.views + 'study/form', opt);
        });
};

exports.create = function (req, res, next) {

    var app = req.app,
        config = app.config,
        db = app.db,
        data = req.body,
        admins = config.admins,
        study,
        signature,
        keyID;

    if (!data.study || !data.signature || !data.keyID) {
        return next(new Error('Invalid request'));
    }

    //define some convenient shortcuts
    try {
        study = JSON.parse(data.study);
    } catch (err) {
        return next(err);
    }
    signature = data.signature;
    keyID = data.keyID;

    //perform as many actions in parallel as possible
    async.auto({

        'admin': function (next2) {
            var admin,
                i;

            //find the admin that is trying to publish a new survey
            for (i in admins) {
                if (admins.hasOwnProperty(i)) {
                    if (admins[i].keyID === keyID) {
                        admin = admins[i];
                        break;
                    }
                }
            }

            //if admin public key not found
            if (!admin) {
                return next2(new Error('Your Survana Admin is not registered with this Survana Publisher.'));
            }

            return next2(null, admin);
        },

        'sig_valid': ['admin', function (next2, results) {
            var admin = results.admin,
                verifier = ursa.createVerifier('sha256'),
                result;

            console.log('using signature', signature);

            verifier.update(data.study);

            try {
                result = verifier.verify(admin.key, signature, 'hex');

                if (!result) {
                    result = 'wrong signature. Please check that the correct public key has been registered with the ' +
                             'publisher.';
                }
            } catch (e) {
                result = e.message;
            }

            //N.B.: because of the try block above, 'result' will always be true when it has a boolean type
            if ((typeof result === "boolean") && result) {
                return next2(null, result);
            }

            return next2(new Error('Could not verify request signature: ' + result));
        }],

        'col': function (next2) {
            db.collection('study', next2);
        },

        'studyID': ['col', function (next2, result) {
            //return only the _id if a study is found
            result.col.findOne({
                'id': study.id
            }, {
                '_id': 1
            }, next2);
        }],

        'studyExists': ['studyID', function (next2, result) {
            if (result.studyID) {
                return next2(new Error('Study ' + study.id + ' has already been published on this server.'));
            }

            return next2(null, false); //study does not exist
        }],

        'insertStudy': ['col', 'studyExists', 'sig_valid', function (next2, result) {
            //delete the _id, just in case
            delete study._id;

            //mark the time when this study was published
            study.published_on = (new Date()).valueOf();

            result.col.insert(study, {'safe': true, 'fsync': true}, next2);
        }]
    },

        function processResult(err, steps) {
            if (err) {
                return next(err);
            }

            return res.send({
                'success': 1,
                'message': 'Study ' + study.id + ' has been published successfully',
                'url': steps.admin.url.replace('%ID%', study.id)
            });
        });

    return true;
};

exports.manifest = function (req, res, next) {
    var app = req.app,
        config = app.config,
        db = app.db,
        study_id = req.params[0],
        i;

    async.auto({
        'study_col': function (next2) {
            db.collection('study', next2);
        },

        'study': [ 'study_col', function (next2, results) {
            results.study_col.findOne({'id': study_id}, {'forms.id': 1, 'store-url': 1, 'overrides': 1, '_id': 0 }, next2);
        }],

        'data': [ 'study', function (next2, results) {
            var forms = [],
                urls = [],
                override;

            //extract the id of each form and append it to 'forms'
            for (i = 0; i < results.study.forms.length; ++i) {
                forms.push(results.study.forms[i].id);
            }

            //add the store-url url to 'urls'
            if (results.study['store-url'] !== undefined) {
                urls.push(results.study['store-url']);
            }

            //add per form 'store-url' values from the 'overrides' array
            if (results.study.overrides !== undefined) {
                //extract any custom store-urls
                for (i = 0; i < results.study.overrides.length; ++i) {
                    override = results.study.overrides[i];
                    console.log('override',override);
                    if (override && (override['store-url'] !== undefined)) {
                        urls.push(override['store-url']);
                    }
                }
            }

            next2(null, {
                'forms': forms,
                'urls': urls
            });
        }]
    }, function (err, result) {
        if (err) {
            return next(err);
        }

        //iPads won't cache the app without the proper content type for the manifest file
        res.header('Content-Type', 'text/cache-manifest');

        res.render(req.views + 'manifest', {
            layout: false,
            study_id: study_id,
            forms: result.data.forms,
            urls: result.data.urls,
            lib: config.lib
        });
    });
};
