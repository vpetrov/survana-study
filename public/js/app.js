/** public/js/app.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define(
        [
            'require',
            'jquery'
        ],
function(require,$)
{
    //fix jQuery/Apple issue with Ajax loading in offline mode
    if (window.navigator.standalone)
        $.ajaxSetup({isLocal:true});

    //jquery.mobile init
    $(document).bind('mobileinit',function(){
        //$.mobile.autoInitializePage=false;
        $.mobile.ignoreContentEnabled=true; //@data-enhance support
    });

    //load jquery mobile and survana
    require([
                'jquery.mobile',
                'survana'
            ],
    function($m,Survana){

        $(document).on({
            'pagesave':Survana.onPageSave, //custom event

            'pagebeforeload':Survana.onPageBeforeLoad,
            'pageload':Survana.onPageLoad,
            'pageloadfailed':Survana.onPageLoadFailed,
            'pagebeforechange':Survana.onPageBeforeChange,
            'pagechange':Survana.onPageChange,
            'pagechangefailed':Survana.onPageChangeFailed,
            'pagebeforeshow':Survana.onPageBeforeShow,
            'pagebeforehide':Survana.onPageBeforeHide,
            'pageshow':Survana.onPageShow,
            'pagehide':Survana.onPageHide,
            'pagebeforecreate':Survana.onPageBeforeCreate,
            'pagecreate':Survana.onPageCreate,
            'pageinit':Survana.onPageInit,
            'pageremove':Survana.onPageRemove,
            'fielddisabled':Survana.onFieldDisabled,
            'updatelayout':Survana.onPageUpdateLayout
        });

        $(document).ready(function(){

            var check=Survana.checkPrerequisites();

            if (check!==true)
            {
                window.location.href='unsupported';
                return;
            }

            $(window).on('orientationchange',Survana.onOrientationChanged);
        });

    });
});
