//appcache events are listed in p.6.7.1.1 at 
//http://www.whatwg.org/specs/web-apps/current-work/multipage/offline.html
window.appcacheEvents='checking noupdate downloading progress cached updateready obsolete error';

function AppCache_check(cache)
{
	var foo=[];

	if ((cache!=OS_UNDEFINED) && (cache.status!=OS_UNDEFINED) && (cache.status!==cache.UNCACHED)) 
		cache.update();
}

function AppCache_doUpdate()
{
	window.applicationCache.swapCache();
	window.location.reload();
}

/** Returns a user friendly message describing the current cache status.
 * @param cache window.applicationCache
 * @warning Make sure to check the browser supports applicationCache
 * @return String The status message or "Unknown"
 */
function AppCache_getStatusMessage(cache)
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

function AppCache_send(data,url)
{
	AppCache_add(data);
	var queue=AppCache_queue();

	//attempt to send the entire queue
    $.ajax({
        type:'POST',
        url:url,
        data:queue,
        dataType:'json',
        cache:false,
        success:function(data,status,xhr){
        	if (typeof(data['successful'])!=='undefined')
        		AppCache_remove(data['successful']);
        	
        	if ((typeof(data['failed'])!=='undefined') && data['failed'].length)
    			console.error('Failed:',data['failed']);
        },
        error:function(xhr,status,e){
        	console.log('oops:',queue);
        }
    });
}

function AppCache_remove(ids)
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
			console.log('AppCache: removing',id);
			delete window.localStorage[id];
		}
		else
			console.log('AppCache: couldn\'t remove',id,': not found');
	}
}

function AppCache_queue()
{
	var queue={};

	//search for all keys that have
	for (var k in window.localStorage)
	{
		if (k.indexOf('appcache-item-')===0)
			queue[k]=window.localStorage[k];
	}

	return queue;
}

function AppCache_items()
{
	var items=[];
	
	for (var k in window.localStorage)
	{
		if (k.indexOf('appcache-item-')===0)
			items.push(k);
	}
	
	return items;
}

function AppCache_add(data)
{
	if (typeof(data)==='undefined')
		return false;

	//generate a random id
	var appcache_id=(new Date().valueOf())+":"+Math.floor(Math.random()*100000);
	var queue_id='appcache-item-'+appcache_id;
	
	if (typeof(window.localStorage[queue_id])!=='undefined')
	{
		console.error('AppCache ID '+appcache_id+' already exists.');
		return false;
	}

	window.localStorage[queue_id]=JSON.stringify(data);
	
	return queue_id;
}
