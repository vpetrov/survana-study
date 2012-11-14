/** public/js/workflow.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define([
       ],
function ()
{
    var LSWF='workflow';
    var LSWF_CURRENT='workflow-current';

    function get()
    {
        if (this.workflow)
            return this.workflow;

        var w=localStorage[LSWF];
        var workflow=null;

        try
        {
            workflow=JSON.parse(w);
        }
        catch (err)
        {
            console.error("Failed to load workflow: "+err);
        }

        if (!workflow || !workflow.length)
        {
            console.error("No workflow definition.")
            return null;
        }

        this.workflow=workflow;

        return this.workflow;
    }

    function reset()
    {
        localStorage[LSWF_CURRENT]=-1;
    }

    function getCurrentIndex()
    {
        //get current workflow index
        var c=localStorage[LSWF_CURRENT];
        if (typeof(c)==='undefined' || !c.toString().length)
            return -1;

        //convert to a number
        c=parseInt(c);

        //unable to convert? use -1 and print an error
        if (isNaN(c))
        {
            console.error("Invalid current workflow number. Defaulting to -1.")
            return -1;
        }

        return c;
    }

    function getNextIndex()
    {
        var workflow=get();
        if (!workflow)
            return null;

        var c=getCurrentIndex();

        c++; // ;)

        //if no more items are available, wrap around
        if (typeof(workflow[c])==='undefined')
            c=0;

        return c;
    }

    function getCurrentItem()
    {
        var c=getCurrentIndex();
        if (c<0)
            c=0;
        return workflow[c];
    }

    function nextItem()
    {
        var index=getNextIndex();
        var next=workflow[index];

        localStorage[LSWF_CURRENT]=index;

        return next;
    }

    function getUrl(index)
    {
        var item=workflow[index];

        if (!item)
            return null;

        if (typeof(item['url'])==="undefined")
        {
            console.error("Workflow item "+nextItem['id']+" does not specify a URL.");
            return null;
        }

        return item['url'];
    }

    function nextUrl()
    {
        var item=nextItem();

        if (typeof(item['url'])==="undefined")
        {
            console.error("Workflow item "+nextItem['id']+" does not specify a URL.");
            return null;
        }

        return item['url'];
    }

    return {
        'get':get,
        'reset':reset,
        'getCurrentIndex':getCurrentIndex,
        'getCurrentItem':getCurrentItem,
        'getNextIndex':getNextIndex,
        'nextItem':nextItem,
        'getUrl':getUrl,
        'nextUrl':nextUrl
    }
});
