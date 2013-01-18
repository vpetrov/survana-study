/** routes/study.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var async=require('async');
var path=require('path');
var dbutil=require('../lib/db.util');
var depend=require('../lib/depend');
var validate=require('../lib/validate');
var bind=require('../lib/bind');
var ursa=require('ursa');

//returns an array of objects, of the form {'id':str,'url':str}
function build_workflow(url_prefix,forms)
{
    //Build the workflow
    var workflow=[];

    for (var f in forms)
    {
        var form=forms[f];
        workflow.push({
            id:form.id,
            url:path.join(url_prefix,form.id)
        });
    }

    return workflow;
}

exports.index=function(req,res,next)
{
    var db=req.app.db;
    var study_id=req.params[0];

    async.waterfall([

        function getStudy(next2)
        {
            dbutil.getStudy(db,study_id,next2);
        },

        function prepareResult(study,next2)
        {
            console.log('found study',study);
            next2(null,study);
        }
    ],
    function processResult(err,study){
        if (err) {
            next(err);
            return;
        }

        if (!study.keys) {
            next(new Error("No public keys could be found for this study."));
            return;
        }

        var key=study.keys[parseInt(Math.random()*1000)%study.keys.length]; //random key

        res.render(req.views+'study/index',{
            key:key,
            study:study,
            server_id:req.app.keyID,
            session_id:req.app.randomId(16),
            workflow:build_workflow(req.originalUrl,study.forms),
            layout:'../layout'
        });
    });
}

exports.form=function(req,res,next)
{
    var app=req.app;
    var db=app.db;
    var config=app.config;

    var study_id=req.params[0];
    var form_id=req.params[1];
    var study=null;
    var form=null;
    var overrides=null;

    async.waterfall([
        function findStudy(next2)
        {
            dbutil.getStudy(db,study_id,next2);
        },

        function findForm(result,next2)
        {
            if (!result)
                return next2(Error('Study '+study_id+'not found.'));

            study=result;

            var form=null;

            for (var i in result.forms)
            {
                if (result.forms[i].id===form_id)
                {
                    form=result.forms[i];
                    if (study.overrides) {
                        overrides=study.overrides[i];
                    }

                    break;
                }
            }

            if (!form)
                return next2(Error('Form '+form_id+' not found.'));

            next2(null,form);
        },

        function override(form,next2) {
            if (form && overrides) {
                obj.override(form,overrides);
            }
            next2(null,form);
        },

        function toHTML(form,next2)
        {
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
            var dep=depend.get(form['data']);
            //translate dependencies to javascript
            var dep_js=depend.translate(dep);
            var rules=validate.get(form['data']);
            var bindings=bind.get(form['data']);

            console.log('bindings',bindings);

            var html=adapter.toHTML(form);

            var opt={
                study:study,
                form:form,
                mobile:req.mobile,
                dep:dep,
                dep_js:dep_js,
                validation_rules:rules,
                bindings:bindings,
                html:html,
                layout:'../form'
            };

            next2(null,opt);
        }
    ],
    function processResult(err,opt)
    {
        if (err)
            return next(err);

        res.render(req.views+'study/form',opt);
    });
}

exports.create=function(req,res,next)
{
    var app=req.app;
    var config=app.config;
    var db=app.db;
    var data=req.body;
    var admins=config.admins;

    if (!data['study'] || !data['signature'] || !data['keyID'])
        next(Error('Invalid request'));

    //define some convenient shortcuts
    var study=data.study;
    var signature=data.signature;
    var keyID=data.keyID;

    //perform as many actions in parallel as possible
    async.auto({

        'admin':function(next2)
        {
            var admin=null;

            //find the admin that is trying to publish a new survey
            for (var i in admins)
            {
                if (admins[i].keyID===keyID)
                {
                    admin=admins[i];
                    break;
                }
            }

            //if admin public key not found
            if (!admin)
                return next2(Error('Your Survana Admin is not registered with this Survana Publisher.'));

            next2(null,admin);
        },

        'sig_valid':['admin',function(next2,result){
            var admin=result.admin;

            console.log('using signature',signature);

            //var result=admin.key.hashAndVerify('sha256',JSON.stringify(study),signature,'hex'); //does not work

            var verifier=ursa.createVerifier('sha256');
            verifier.update(JSON.stringify(study));

            var result;

            try
            {
                result=verifier.verify(admin.key,signature,'hex');

                if (!result)
                    result='wrong signature. Please check that the correct public key has been registered with the publisher.';
            }
            catch (e)
            {
                result=e.message;
            }

            //N.B.: because of the try block above, 'result' will always be true when it has a boolean type
            if ((typeof(result)=="boolean") && result)
                return next2(null,result);

            return next2(Error('Could not verify request signature: '+result));
        }],

        'col':function(next2)
        {
            db.collection('study',next2);
        },

        'studyID':['col',function(next2,result)
        {
            //return only the _id if a study is found
            result.col.findOne({
                'id':study.id,
            },{
                '_id':1
            },next2);
        }],

        'studyExists':['studyID',function(next2,result)
        {
            if (result.studyID)
                return next2(Error('Study '+study.id+' has already been published on this server.'));

            next2(null,false); //study does not exist
        }],

        'insertStudy':['col','studyExists','sig_valid',function(next2,result)
        {
            //delete the _id, just in case
            delete study['_id'];

            //mark the time when this study was published
            study['published_on']=(new Date()).valueOf();

            result.col.insert(study,{'safe':true,'fsync':true},next2);
        }]
    },

    function processResult(err,steps)
    {
        if (err)
            return next(err);

        res.send({
            'success':1,
            'message':'Study '+study.id+' has been published successfully',
            'url':steps.admin.url.replace('%ID%',study.id)
        });
    });
}
