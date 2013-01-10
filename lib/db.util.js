/** lib/db.util.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

var async = require('async');

exports.getStudy = function(db,study_id,next)
{
    async.waterfall([
        function getCollection(next2) {
            db.collection('study',next2);
        },

        function findStudy(collection,next2){
            collection.findOne({'id':study_id},next2);
        }
    ],
        function processResult(err,result)
        {
            if (err)
                return next(err);

            next(null,result);
        });
};

exports.getForm = function(db,form_id,next)
{
    async.waterfall([
        function getCollection(next2) {
            db.collection('form',next2);
        },

        function getForm(collection,next2)
        {
            collection.findOne({'id':form_id},next2);
        }
    ],
        function processResult(err,result){
            if (err)
                next(err);

            next(null,result);
        });
};

exports.getForms = function (db,forms,next)
{
    async.waterfall([
        function getCollection(next2) {
            db.collection('form',next2);
        },

        function getForms(collection,next2)
        {
            collection.find({'id':{
                '$in':forms
            }}).toArray(next2);
        }
    ],
        function processResult(err,result)
        {
            if (err)
                next(err);

            next(null,result);
        });
};
