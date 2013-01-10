/** public/js/survana.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define([
        'jquery',
        'jquery.mobile',
        'workflow',
        'appcache',
        'depend',
        'validate',
        'bind',
        'crypto'
       ],
function ($,$m,Workflow,AppCache,Depend,Validate,Bind,Crypto)
{
    function checkPrerequisites()
    {
        //check for JSON
        if (typeof JSON === undefined)
            return "Your browser does not support JSON objects."

        //check for JSON stringify
        if ((typeof JSON['stringify'] !== 'function') || (typeof JSON['parse'] !== 'function'))
            return "Your browser cannot read and write JSON objects.";

        return true;
    }

    function reset()
    {
        Workflow.reset();
        gotoNextPage();
    }

    function resume()
    {
        var index=Workflow.getCurrentIndex();

        if (index<0)
            reset();
        else
        {
            var url=Workflow.getUrl(index);
            gotoPage(url);
        }
    }

    function gotoPage(url)
    {
        if (!url)
        {
            console.error('Invalid page URL',url);
            return false;
        }

        console.log('Changing page to:',url);
        $.mobile.changePage(url);

        return true;
    }

    function gotoNextPage()
    {
        var url=Workflow.nextUrl();
        return gotoPage(url);
    }

    function logevent(e)
    {
        var page=e.target;

        console.log(e, e.type,page.id);
    }

    function onPageSave(e)
    {
        logevent(e);
    }

    function onPageBeforeLoad(e)
    {
        logevent(e);
    }

    function onPageLoad(e)
    {
        logevent(e);
    }

    function onPageLoadFailed(e)
    {
        logevent(e);
    }

    function onPageBeforeChange(e)
    {
        logevent(e);
    }

    function onPageChange(e)
    {
        logevent(e);
    }

    function onPageChangeFailed(e)
    {
        logevent(e);
    }

    function onPageBeforeShow(e)
    {
    }

    function onPageBeforeHide(e)
    {
        logevent(e);
        console.log('clear before hide');
        clear();
        Validate.clean();
    }

    function clearField(f,jqmMethod)
    {
        f=$(f);
        var el=f.get(0);

        //note: couldn't get jquery mobile to use .val() to update select values, so this hack uses the raw html
        //select and its 'selectedIndex' property, and then fires a 'change' even on that select, which is then
        //handled by jquery mobile to update the UI.
        if (jqmMethod==='select')
        {
            if (!el.disabled && (el.selectedIndex!=0))
                el.selectedIndex=0;
            f[jqmMethod]('refresh');
        }
        else if (jqmMethod==='checkboxradio')
        {
            f.prop('checked',false);
            f[jqmMethod]('refresh');
        }
        else if (jqmMethod==='slider')
        {
            f.val(0);
            f[jqmMethod]('refresh');
        }
        else
        {
            $(f).val('');
        }

        $(f).trigger('change');
    }

    function onPageHide(e)
    {
        logevent(e);
    }

    function onPageBeforeCreate(e)
    {
        logevent(e);
    }

    function onPageCreate(e)
    {
        logevent(e);
    }

    function onPageInit(e)
    {
        var page=$(e.target);

        page.css('visibility','');
        page.find('a.btn-next').click(onNextClick);
        page.find('input,select').change(onFieldChanged);

        page.find('form').each(function(i,f){
            Validate.init(f.id,f);
        });

        logevent(e);
    }

    function onPageShow(e)
    {
        localStorage['form-timestamp']=(new Date()).valueOf();
        logevent(e);
    }

    function onPageRemove(e)
    {
        logevent(e);
    }

    function onPageUpdateLayout(e)
    {
        logevent(e);
    }

    function onFieldChanged(e)
    {
        logevent(e);
        var target=$(e.target);
        var form_id=$.mobile.activePage.attr('data-form');
        dependCheck(target.attr('name'));
        Validate.checkField(form_id,target);
        Bind.field(form_id,target);
    }

    function onFieldDisabled(e)
    {
        logevent(e);

        var field=$(e.target);

        //if the field has an error attached to it
        if (field.hasClass('os-ui-error'))
        {
            //find the first container element (since errors will be attached to parent container)
            //then find all warning buttons (because one could have embedded errors (in theory)) and remove the wrapper
            //element
            var container=field.closest('.os-ui-container,.ui-controlgroup-controls')
                               .first()
                               .find('a.os-ui-error').each(function(i,error){
                                   $(error).parent().remove();
                               });
            field.removeClass('os-ui-error');
        }
    }

    function onNextClick(e)
    {
        var preview = $.mobile.activePage.attr('data-preview');

        console.log('preview?',preview);

        if (validate() && !preview)
            save(gotoNextPage);
        else
            scrollTo($.mobile.activePage.find('.os-ui-error-button:visible').first(),true);
    }

    function toContext(form_data)
    {
        var result={};

        for (var i in form_data)
        {
            var field=form_data[i];
            var id=field['name']||field['id'];

            //no name or id? skip field.
            if (typeof(id)==='undefined')
                continue;

            if (typeof(result[id])==='undefined')
                result[id]=field['value'];
            else if ($.isArray(result[id]))
                result[id].push(field['value']);
            else
            {
                //transform value to array
                result[id]=[result[id]];
                //append new value
                result[id].push(field['value']);
            }
        }

        return result;
    }

    function getJQMType(el)
    {
        var el=$(el);
        if (!el.length)
            return null;

        switch(el.get(0).tagName.toLowerCase())
        {
            case 'input':   //check the type of the element
                switch (el.attr('type').toLowerCase())
                {
                    case 'radio':
                    case 'checkbox':
                        return 'checkboxradio';
                        break;
                    case 'number':
                    case 'email':
                    case 'password':
                    case 'text':
                        return 'textinput';
                        break;
                }
                break;

            case 'select':  return 'selectmenu';
                break;
            default: console.error('depend action: unknown element kind:',el);
        }

        return null;
    }

    function clear()
    {
        $.mobile.activePage.find('form').each(function(i,f){
            f.reset();
        });

        $.mobile.activePage.find('input:text, input:password, input:file, select, textarea').val('');
        $.mobile.activePage.find('input:radio, input:checkbox').removeAttr('checked').removeAttr('selected');
    }

    function action(el,actions)
    {
        el=$(el,$.mobile.activePage);

        if (!el.length)
        {
            console.error('Survana action: element could not be found',el);
            return false;
        }

        if (!$.isArray(actions))
            actions=[actions];

        for (var i in actions)
        {
            var action_name=actions[i];

            switch (action_name)
            {
                //enable
                case 'enable':

                //disable
                case 'disable':
                    var jqm_method=getJQMType(el);
                    if (typeof(el[jqm_method])!=='function')
                    {
                        console.error('Survana Error: element ',el,' does not have jQuery Mobile method:',jqm_method);
                        return false;
                    }

                    //todo: make sure this works on numeric inputs, on selects, on radiogroups and checkboxgroups
                    if (action_name==='disable')
                    {
                        clearField(el,jqm_method);
                        el.trigger('fielddisabled');
                    }

                    //perform the jquery mobile action
                    el[jqm_method](action_name);
                    break;

                //focus
                case 'focus':
                    if (!el.first().is(':focus'))
                        el.first().focus();
                    break;

                //blur
                case 'blur':
                    if (el.first().is(':focus'))
                        el.first().blur();
                    break;

                //show
                case 'show':
                    //make sure the element is enabled
                    action(el,'enable');

                    //embedded fields
                    var elements=el.closest('.os-ui-container');

                    if (!elements.length)
                        elements=el.closest('li[data-role=fieldcontain]');

                    //add previous question, if it exists
                    if (elements.prev().hasClass('os-ui-question'))
                        elements=elements.add(elements.prev());

                    elements.show();
                    break;

                //hide
                case 'hide':
                    //embedded fields
                    var elements=el.closest('.os-ui-container');

                    if (!elements.length)
                        elements=el.closest('li[data-role=fieldcontain]');

                    //add previous question, if it exists
                    if (elements.prev().hasClass('os-ui-question'))
                        elements=elements.add(elements.prev());

                    elements.hide();

                    //make sure the element is disabled
                    action(el,'disable');
                    break;
            }
        }

        return true;
    }

    function dependAction(field_name,actions)
    {
        return action('[name='+field_name+']',actions);
    }

    function dependCheck(changed)
    {
        var form_id=$.mobile.activePage.attr('data-form');
        //get form data
        var data=$('form#'+form_id).serializeArray();
        /*var data={
            'marital':6
        };*/

        //check all field dependencies
        //todo: build a dependency graph and only check those fields that are impacted by this change
        Depend.check(form_id,toContext(data),changed);
        //Depend.check(form_id,data,changed);
    }

    function validate()
    {
        var result=true;

        $.mobile.activePage.find('form').each(function(i,f){
            if (!Validate.check(f))
                result=false;
        });

        return result;
    }

    function save(success)
    {
        var url="http://survana.org";

        $.mobile.activePage.find('form').each(function(i,f){

            var payload={
                'id':{
                    'survana':localStorage['survana-id'],
                    'study':localStorage['study-id'],
                    'form':f.id,
                    'session':localStorage['session-id']+":"+localStorage['session'],
                    'key':localStorage['key-id']
                },
                'timestamp':{
                    'server_session':localStorage['session-timestamp'],
                    'client_session':localStorage['session-timestamp-client'],
                    'form_start':localStorage['form-timestamp'],
                    'form_end':(new Date()).valueOf().toString()
                },
                'data':formToJSON(f)
            };

            var packet={
                'key':{
                    'id':localStorage['key-id'],
                    'pem':localStorage['key-pem'],
                    'bits':localStorage['key-bits'],
                },
                'payload':encrypt(payload)
            };

            console.log('Saving form',packet);

            AppCache.send(packet,url);
        });

        success();
    }

    function formToJSON(form)
    {
        form=$(form);
        //var elements=form.get(0).os_elements;

        var checkboxes=[];
        //find all checkboxes
        form.find('input[type=checkbox]').each(function(i,el){
            if (el['name'])
                checkboxes.push(el.name);
        });


        var data=form.serializeArray();
        var result={};

        $(data).each(function(i,field){
            var name=field['name'];
            var value=field['value'];

            if (typeof(result[name])==="undefined")
            {
                //check if the name is for a checkbox and always make that an array
                if (checkboxes.indexOf(name)!=-1)
                    result[name]=[value];
                else
                    result[name]=value;
            }
            else
            if ($.isArray(result[name]))
                result[name].push(value);
            else
            {	//convert the value to an array
                var original_value=result[name];
                result[name]=[original_value];
            }
        });

        return result;
    }

    function scrollTo(el,anim,container)
    {
        el=$(el);

        if (!el.length)
            return;

        if ((typeof(anim)!=="undefined") && anim)
            anim=true;
        else
            anim=false;

        if (typeof(container)=="undefined")
            container=$('body');
        else
            container=$(container);

        var vpheight=container.height();
        var elheight=el.height();
        var scroll_y=el.offset().top + (elheight/2) - (vpheight/2);

        if (anim)
            container.animate({
                                  scrollTop:scroll_y
                              })
        else
            container.scrollTop(scroll_y);
    }


    /*function onOrientationChanged(e)
    {
        var page=$.mobile.activePage;
        var errorlabels=page.find('.os-ui-error-label');
        updateErrorPosition(errorlabels);
    }*/

    /** Encrypts an object or a string.
     * Uses AES256 to encrypt the data with a random 32 character password.
     * Uses RSA(384-1024,configurable) to encrypt the password using the server's public key.
     *
     * @param {String|Object} data
     * @return False on Failure, Object(encrypted_password,encrypted_data) on Success
     */
    function encrypt(data,password)
    {
        if (typeof data==="undefined")
            return false;
        else if (typeof data==="object")
        {
            try
            {
                data=JSON.stringify(data);
            }
            catch (err)
            {
                console.error('Failed to convert JSON to string',data,err.message);
                return false;
            }
        }

        var key=null;

        //decide whether the public key needs to be decoded
        if ((typeof localStorage['key-data']==='undefined') || !localStorage['key-data'].length)
        {
            key=Crypto.decodeKey(localStorage['key-pem']);

            if (!key)
            {
                console.error('failed to decode public key',localStorage['key-pem']);
                return false;
            }

            //store the decoded key
            localStorage['key-data']=JSON.stringify(key);
        }
        else
        {
            //read the key data from localStorage
            try
            {
                key=JSON.parse(localStorage['key-data']);
            }
            catch (err)
            {
                console.error('Failed to read key data',err.message);
                return false;
            }
        }

        return Crypto.encrypt(data,key);
    }

    return {
        'Depend':Depend,
        'Validate':Validate,
        'Bind':Bind,
        'checkPrerequisites':checkPrerequisites,
        'reset':reset,
        'clear':clear,
        'resume':resume,
        'gotoNextPage':gotoNextPage,
        'onPageSave':onPageSave,
        'onPageBeforeLoad':onPageBeforeLoad,
        'onPageLoad':onPageLoad,
        'onPageLoadFailed':onPageLoadFailed,
        'onPageBeforeChange':onPageBeforeChange,
        'onPageChange':onPageChange,
        'onPageChangeFailed':onPageChangeFailed,
        'onPageBeforeShow':onPageBeforeShow,
        'onPageBeforeHide':onPageBeforeHide,
        'onPageHide':onPageHide,
        'onPageBeforeCreate':onPageBeforeCreate,
        'onPageCreate':onPageCreate,
        'onPageInit':onPageInit,
        'onPageShow':onPageShow,
        'onPageRemove':onPageRemove,
        'onPageUpdateLayout':onPageUpdateLayout,
        'onFieldChanged':onFieldChanged,
        'onFieldDisabled':onFieldDisabled,
        'action':action,
        'dependAction':dependAction,
        'scrollTo':scrollTo
    };
});
