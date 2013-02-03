/** public/js/workflow.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define([
    'storage'
],
    function (Store) {
        "use strict";

        var LSWF = 'workflow',
            LSWF_CURRENT = 'workflow-current',
            workflow;

        function get() {
            if (workflow) {
                return workflow;
            }

            var w = Store.get(LSWF);

            try {
                workflow = JSON.parse(w);
            } catch (err) {
                console.error("Failed to load workflow: " + err);
            }

            if (!workflow || !workflow.length) {
                console.error("No workflow definition.");
                return null;
            }

            return workflow;
        }

        function reset() {
            Store.put(LSWF_CURRENT, -1);
        }

        function getCurrentIndex() {
            //get current workflow index
            var c = Store.get(LSWF_CURRENT);
            if (c === undefined || !c.toString().length) {
                return -1;
            }

            //convert to a number
            c = parseInt(c, 10);

            //unable to convert? use -1 and print an error
            if (isNaN(c)) {
                console.error("Invalid current workflow number. Defaulting to -1.");
                return -1;
            }

            return c;
        }

        function getNextIndex() {
            var workflow = get(),
                c;

            if (!workflow) {
                return null;
            }

            c = getCurrentIndex();

            c++; // ;)

            //if no more items are available, wrap around
            if (workflow[c] === undefined) {
                c = 0;
            }

            return c;
        }

        function getCurrentItem() {
            var c = getCurrentIndex();
            if (c < 0) {
                c = 0;
            }

            return workflow[c];
        }

        function nextItem() {
            var index = getNextIndex(),
                next = workflow[index];

            Store.put(LSWF_CURRENT, index);

            return next;
        }

        function getUrl(index) {
            var item = workflow[index];

            if (!item) {
                return null;
            }

            if (item.url === undefined) {
                console.error("Workflow item " + nextItem.id + " does not specify a URL.");
                return null;
            }

            return item.url;
        }

        function nextUrl() {
            var item = nextItem();

            if (item.url === undefined) {
                console.error("Workflow item " + nextItem.id + " does not specify a URL.");
                return null;
            }

            return item.url;
        }

        return {
            'get': get,
            'reset': reset,
            'getCurrentIndex': getCurrentIndex,
            'getCurrentItem': getCurrentItem,
            'getNextIndex': getNextIndex,
            'nextItem': nextItem,
            'getUrl': getUrl,
            'nextUrl': nextUrl
        };
    });
