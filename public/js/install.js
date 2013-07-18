/** public/js/install.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

"use strict";

//appcache events are listed in p.6.7.1.1 at
//http://www.whatwg.org/specs/web-apps/current-work/multipage/offline.html
var appcacheEvents = 'checking noupdate downloading progress cached updateready obsolete error'; //TODO: use this

function Install_check(cache) {
    if ((cache !== undefined) && (cache.status !== undefined) && (cache.status !== cache.UNCACHED)) {
        cache.update();
    }
}

function Install_doUpdate(cache) {
    cache.swapCache();
    window.location.reload();
}

/** Returns a user friendly message describing the current cache status.
 * @param cache window.applicationCache
 * @warning Make sure to check the browser supports applicationCache
 * @return String The status message or "Unknown"
 */
function Install_getStatusMessage(cache) {
    switch (cache.status) {
    //The object is not currently associated with an application cache.
    case cache.UNCACHED:
        return "Disabled";

    //The application cache is idle, that is, not in the process of being updated.
    case cache.IDLE:
        return "Idle";

    //The application cache manifest is being retrieved and checked for updates.
    case cache.CHECKING:
        return "Checking for updates ...";

    //The resources specified in the application cache manifest are being downloaded.
    case cache.DOWNLOADING:
        return "Downloading updates ...";

    //A new version of the application cache is available.
    case cache.UPDATEREADY:
        return "Available";

    //The application cache is obsolete.
    case cache.OBSOLETE:
        return "Available";
    }

    return "Unknown";
}
