/** public/js/appcache.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define(
    [
    ],
function()
{
    //appcache events are listed in p.6.7.1.1 at
    //http://www.whatwg.org/specs/web-apps/current-work/multipage/offline.html
    var appcacheEvents='checking noupdate downloading progress cached updateready obsolete error'; //TODO: use this

    function check(cache)
    {
        var foo=[];

        if ((cache!=OS_UNDEFINED) && (cache.status!=OS_UNDEFINED) && (cache.status!==cache.UNCACHED))
            cache.update();
    }

    function doUpdate()
    {
        swapCache();
        window.location.reload();
    }

    /** Returns a user friendly message describing the current cache status.
     * @param cache window.applicationCache
     * @warning Make sure to check the browser supports applicationCache
     * @return String The status message or "Unknown"
     */
    function getStatusMessage(cache)
    {
        switch (cache.status)
        {
            //The object is not currently associated with an application cache.
            case cache.UNCACHED:    return "Disabled";

            //The application cache is idle, that is, not in the process of being updated.
            case cache.IDLE:        return "Idle";

            //The application cache manifest is being retrieved and checked for updates.
            case cache.CHECKING:    return "Checking for updates ...";

            //The resources specified in the application cache manifest are being downloaded.
            case cache.DOWNLOADING: return "Downloading updates ...";

            //A new version of the application cache is available.
            case cache.UPDATEREADY: return "Available";

            //The application cache is obsolete.
            case cache.OBSOLETE:    return "Available";
        }

        return "Unknown";
    }

    function send(data,url)
    {
        var batch,
            i;

        //append data to the queue
        //make sure the data is a string to save time on parsing it back
        add({
            'data': JSON.stringify(data),
            'url':  url
        });

        //fetch the entire queue
        batch=queue();

        /* We can't send the entire queue with 1 request because we use JSONP for cross domain requests, which works
           with GET only (and we don't necessarily know if the URL is in the same domain). For now, fallback on using
           1 request per appcache-item and hope that no proxy will truncate the Host: parameter.
         */
        for (i in batch) {
            if (batch.hasOwnProperty(i)) {
                $.ajax({
                    url:    batch[i].url,
                    data:{
                        'id':   i,
                        'data': batch[i].data
                    },
                    dataType:'jsonp',
                    cache:false,
                    success:function(data,status,xhr){
                        if (typeof(data['successful'])!=='undefined') {
                            remove(data['successful']);
                        }

                        if ((typeof(data['failed'])!=='undefined') && data['failed'].length)
                            console.error('Failed:',data['failed']);
                    },
                    error:function(xhr,status,e){
                        console.log('failed to send data:',batch[i]);
                    }
                });
            }
        }
    }

    function remove(ids)
    {
        if (typeof(ids)==="undefined")
            return;
        else if (typeof(ids)!=="object")
            ids=[ids];

        for (var i=0;i<ids.length;++i)
        {
            var id=ids[i];
            if (typeof(window.localStorage[id])!=='undefined')
            {
                console.log('appcache: removing',id);
                delete window.localStorage[id];
            }
            else
                console.log('appcache: couldn\'t remove',id,': not found');
        }
    }

    function count() {
        var i, c = 0;

        for (i in window.localStorage) {
            if (window.localStorage.hasOwnProperty(i)) {
                if (i.indexOf('appcache-item-') === 0) {
                    c++; // ;)
                }
            }
        }

        return c;
    }

    function queue()
    {
        var q={};

        //search for all keys that contain 'appcache-item-'
        for (var k in window.localStorage)
        {
            if (k.indexOf('appcache-item-')===0) {
                try {
                    q[k]=JSON.parse(window.localStorage[k]);
                } catch (err) {
                    console.error('appcache: failed to parse item',k,err);
                }

            }

        }

        return q;
    }

    function items()
    {
        var i=[];

        for (var k in window.localStorage)
        {
            if (k.indexOf('appcache-item-')===0)
                i.push(k);
        }

        return i;
    }

    function add(data,guard)
    {
        //won't add junk to the queue
        if (typeof(data)==='undefined')
            return false;

        //generate a random id
        var appcache_id=(new Date().valueOf())+"-"+Math.floor(Math.random()*100000);
        var queue_id='appcache-item-'+appcache_id;

        //make sure we're not overwriting an already added item
        if (typeof(window.localStorage[queue_id])!=='undefined')
        {
            console.error('appcache: ID '+appcache_id+' already exists.');

            //The uniqueness of items is based on the timestamp and a random number, but it looks like a collision has
            //happened. Instead of returning 'false', we can avoid overwriting an existing item by recursively calling
            //ourselves - the call will likely generate either a new timestamp or a new random id. We're betting on
            //the fact that it is highly unlikely for (increasing timestamps + random number) to conflict twice in a row
            //If by some miracle the problem is somewhere else (and queue_id ends up being the same value every time),
            //we are relying on the 'guard' variable to avoid infinite recursive calls.

            if (typeof(guard)!=='undefined')
            {
                if (guard>0)
                    return add(data,guard-1);
                else
                    return false;   //give up.
            }
            else
                return add(data,50); //50 ought to be enough for anybody.
        }

        window.localStorage[queue_id]=JSON.stringify(data);

        return queue_id;
    }

    //public API
    return {
        'add':      add,
        'send':     send,
        'items':    items,
        'queue':    queue,
        'count':    count
    };
});
