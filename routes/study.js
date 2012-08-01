var step=require('step');
var path=require('path');

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

function dbGetStudy(db,study_id,fnSuccess)
{
    var colStudy=null;

    step(
        function getCollection() {
            db.collection('study',this);
        },

        function findStudy(err,collection){
            if (err) throw err;

            col=collection;

            col.findOne({'id':study_id},fnSuccess);
        }
    );
}

function dbGetForm(db,form_id,fnSuccess)
{
    step(
        function getCollection() {
            db.collection('form',this);
        },

        function getForm(err,collection)
        {
            if (err) throw err;

            collection.findOne({'id':form_id},fnSuccess);
        }
    );
}

function dbGetForms(db,forms,fnSuccess)
{
    step(
        function getCollection() {
            db.collection('form',this);
        },

        function getForms(err,collection)
        {
            if (err) throw err;

            collection.find({'id':{
                '$in':forms
            }}).toArray(fnSuccess);
        }
    );
}

exports.index=function(req,res,rerror)
{
    var db=req.app.db;
    var study_id=req.params[0];
    var study=null;

    step(
        function getStudy()
        {
            dbGetStudy(db,study_id,this);
        },

        function getForms(err,result)
        {
            if (err) throw err;

            study=result;

            dbGetForms(db,study.forms,this)
        },

        function result(err,forms)
        {
            if (err) return rerror(err);

            if (!forms) return rerror(Error('Failed to fetch form descriptions'));

            if (forms.length!=study.forms.length)
                return rerror(Error("Study "+study.id+" has references to missing forms."));

            for (var f in forms)
            {
                var form=forms[f];
                var pos=study.forms.indexOf(form.id);
                study.forms[pos]=form;
            }

            res.render(req.views+'study/install',{
                study:study,
                workflow:build_workflow(req.originalUrl,study.forms),
                layout:'../layout'
            });
        }
    );
}

exports.form=function(req,res,rerror)
{
    var db=req.app.db;
    var config=req.app.config;

    var study_id=req.params[0];
    var form_id=req.params[1];
    var study=null;
    var form=null;

    step(
        function query()
        {
            dbGetStudy(db,study_id,this.parallel());
            dbGetForm(db,form_id,this.parallel());
        },

        function db_result(err,study_result,form_result)
        {
            if (err) throw err;

            if (!study_result)
            {
                res.send('Study not found: '+study_id,404);
                return;
            }

            if (!form_result)
            {
                res.send('Form not found: '+form_id,404);
            }

            study=study_result;
            form=form_result;

            return form;
        },

        function response(err)
        {
            if (err) throw err;

            var adapter=null;

            //load appropriate adapter, from module root
            if (req.mobile)
                adapter=require(path.join(req.app.dirname,config.adapters.mobile));
            else
                adapter=require(path.join(req.app.dirname,config.adapters.desktop));

            res.render(req.views+'study/form',{
                study:study,
                form:form,
                html:adapter.toHTML(form,req.app.config.theme),
                layout:'../layout'
            });
        }
    );
}
