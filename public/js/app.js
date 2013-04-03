/** public/js/app.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define(
    [
        'jquery',
        'storage',
        'workflow',
        'jquery.mobile',
        'survana'
    ],
    function ($, Store, Workflow, $jqm, Survana) {
        "use strict";

        //fix older browsers
        function oldBrowserFix() {

            if (!String.prototype.trim) {
                String.prototype.trim = function () {
                    return this.replace(/^\s+|\s+$/g, '');
                };
            }
        }

        //jquery.mobile init
        function jqmInit() {

            //fix jQuery/Apple issue with Ajax loading in offline mode
            if (window.navigator.standalone) {
                $.ajaxSetup({isLocal: true});
            }

            $(document).on({
                'pagesave': Survana.onPageSave, //custom event

                'pagebeforeload': Survana.onPageBeforeLoad,
                'pageload': Survana.onPageLoad,
                'pageloadfailed': Survana.onPageLoadFailed,
                'pagebeforechange': Survana.onPageBeforeChange,
                'pagechange': Survana.onPageChange,
                'pagechangefailed': Survana.onPageChangeFailed,
                'pagebeforeshow': Survana.onPageBeforeShow,
                'pagebeforehide': Survana.onPageBeforeHide,
                'pageshow': Survana.onPageShow,
                'pagehide': Survana.onPageHide,
                'pagebeforecreate': Survana.onPageBeforeCreate,
                'pagecreate': Survana.onPageCreate,
                'pageinit': Survana.onPageInit,
                'pageremove': Survana.onPageRemove,
                'fielddisabled': Survana.onFieldDisabled,
                'updatelayout': Survana.onPageUpdateLayout
            });

            $(document).ready(function () {

                var check = Survana.checkPrerequisites();

                if (check !== true) {
                    window.location.href = 'unsupported';
                    return;
                }

                $(window).on('orientationchange', Survana.onOrientationChanged);
            });
        }

        function start(startUrl) {
            console.log('Going to ',startUrl);
            document.location.href = startUrl;
        }

        //app init
        function init(study_id, server_info, session_info) {
            var startUrl;

            oldBrowserFix();

            Store.init(study_id);

            //server
            Store.put(server_info);

            //make sure not to overwrite any existing session information
            if (!Store.has('session-id')) {
                Store.put(session_info);

                startUrl = Workflow.nextUrl();
            } else {
                startUrl = Workflow.getCurrentUrl();
            }

            jqmInit();

            start(startUrl);
        }

        return {
            'init': init,
            'start': start
        };
    }
);
