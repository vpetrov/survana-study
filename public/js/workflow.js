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

        var WF = 'workflow',
            WF_WRAP = 'workflow-wrap',
            WF_CURRENT = 'workflow-current',
            workflow,
            wrap;

        function get() {
            if (workflow) {
                return workflow;
            }

            var w = Store.get(WF);

            try {
                workflow = JSON.parse(w);
            } catch (err) {
                console.error("Failed to load workflow: " + err);
            }

            if (!workflow || !workflow.length) {
                console.error("No workflow definition.");
                return null;
            }

            wrap = Store.get(WF_WRAP);

            return workflow;
        }

        function count() {
            return workflow.length;
        }

        function reset() {
            Store.put(WF_CURRENT, -1);
        }

        function getCurrentIndex() {
            //get current workflow index
            var c = Store.get(WF_CURRENT);

            if (c === null) {
                return null;
            }

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

            if (c === null) {
                return null;
            }

            c++; // ;)

            //if no more items are available, wrap around
            if (workflow[c] === undefined) {
                if (wrap) {
                    c = 0;
                } else {
                    c = null;
                }

            }

            return c;
        }

        function getCurrentItem() {
            var c = getCurrentIndex();

            if (c === null) {
                return null;
            }

            if (c < 0) {
                c = 0;
            }

            if (!workflow) {
                get();
            }

            return workflow[c];
        }

        function nextItem() {
            var index = getNextIndex(),
                next;

            if (index === null) {
                return null;
            }

            next = workflow[index];

            Store.put(WF_CURRENT, index);

            return next;
        }

        function getCurrentUrl() {
            var item = getCurrentItem();

            if (!item) {
                return null;
            }

            return item.url;
        }

        function getUrl(index) {
            var _workflow = get(),
                item = _workflow[index];

            if (!item) {
                return null;
            }

            if (item.url === undefined) {
                console.error("Workflow item " + item.id + " does not specify a URL.");
                return null;
            }

            return item.url;
        }

        function nextUrl() {
            var item = nextItem();

            if (item === null) {
                return null;
            }

            if (item.url === undefined) {
                console.error("Workflow item " + item.id + " does not specify a URL.");
                return null;
            }

            return item.url;
        }

        function willWrap() {
            return (wrap === 1 || wrap === "1" || wrap === "true");
        }

        function isLast() {
            if (!workflow) {
                get();
            }

            if (!workflow) {
                return true;
            }

            return (getCurrentIndex() === (workflow.length - 1));
        }

        return {
            'get': get,
            'count': count,
            'willWrap':  willWrap,
            'reset': reset,
            'getCurrentIndex':  getCurrentIndex,
            'getCurrentItem':   getCurrentItem,
            'getCurrentUrl':    getCurrentUrl,
            'getNextIndex': getNextIndex,
            'nextItem': nextItem,
            'getUrl': getUrl,
            'nextUrl': nextUrl,
            'isLast': isLast
        };
    });
