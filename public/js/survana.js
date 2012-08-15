define([
        'jquery',
        'jquery.mobile',
        'workflow',
        'depend',
        'validate'
       ],
function ($,$m,Workflow,Depend,Validate)
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

    function clearField(f)
    {
        f=$(f);
        var el=f.get(0);

        //note: couldn't get jquery mobile to use .val() to update select values, so this hack uses the raw html
        //select and its 'selectedIndex' property, and then fires a 'change' even on that select, which is then
        //handled by jquery mobile to update the UI.
        if (el.tagName.toLowerCase()==='select')
        {
            if (!el.disabled && (el.selectedIndex!=0))
            {
                el.selectedIndex=0;
                f.trigger('change');
            }
        }
        else
            $(f).val('');
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
        dependCheck(target.attr('name'));
        Validate.checkField($.mobile.activePage.attr('data-form'),target);
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
        //todo: validate and save page here
        if (validate())
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
                        clearField(el);
                        el.trigger('fielddisabled');
                    }

                    //perform the jquery mobile action
                    el[jqm_method](action_name);
                    break;

                //focus
                case 'focus':
                    if (!el.is(':focus'))
                        el.focus();
                    break;

                //blur
                case 'blur':
                    if (el.is(':focus'))
                        el.blur();
                    break;

                //show
                case 'show':
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
        console.log('Saving form to the server');
        success();
    }

    function scrollTo(el,anim,container)
    {
        el=$(el);

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

    return {
        'Depend':Depend,
        'Validate':Validate,
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

function OS_onNext(e)
{
	OS_save($.mobile.activePage);
	Workflow_next();
}

function OS_save(target_page)
{
	var page=$(target_page);
	var page_id=page.attr('id');

	var form=page.find('form');

	if (!form.length)
		return console.error('No form declared on page ',page_id);

	var handler=OS_getPageEventHandler(page_id,"pagesave");

	if (!handler)
		return console.error('No save handler registered for form ',page_id);

	form.each(function(index,f) {
		return handler(f);
	});
}

function OS_onBack(e)
{
	$(document).trigger('pageback');
}


/** Monitors elements for change, and assigns the handler Form_onTypeChanged, where
 * Form and Type vary.
 * @param form Name of the questionnaire (e.g. Demographics)
 * @param monitor A list of elements and their types ($ui->elements)
 */
function OS_monitor(form,monitor)
{
    for (var type in monitor)
    {
        var elements=monitor[type];
        var nelements=elements.length;
        var search="id";
        var callback=form+'_on'+type.charAt(0).toUpperCase()+type.substring(1)+'Changed';

        if (typeof window[callback]!=="function")
        {
            console.error("No callback defined for monitor type",type);
            continue;
        }

        if ((type=="radio") || (type=='check'))
            search="name";

        for (var i=0;i<nelements;++i)
        {
            var el;

            if (search=='id')
                el=$('#'+elements[i]);
            else
                el=$(':input[name='+elements[i]+']');

           el.on('change',window[callback]);
        }
    }
}

/** Removes the element onchange handlers
 * @param form Name of the questionnaire (e.g. Demographics)
 * @param monitor A list of elements and their types ($ui->elements)
 */
function OS_unmonitor(form,monitor)
{
	for (var type in monitor)
	{
		var elements=monitor[type];
		var nelements=elements.length;
		var search='id';
		var callback=form+'_on'+type.charAt(0).toUpperCase()+type.substring(1)+'Changed';

		if (typeof window[callback]!=='function')
			continue;

		if (type=='radio')
			search='name';

		for (var i=0;i<nelements;++i)
		{
			var el;

            if (search=='id')
                el=$('#'+elements[i]);
            else
                el=$(':input[name='+elements[i]+']');

           el.off('change',window[callback]);
		}
	}
}

function OS_focus(id)
{
	var el=$(id);

	if (!el.is(':focus'))
		el.focus();
}

function OS_focusIfEmpty(id)
{
	if (!$(id).val().length)
		OS_focus(id);
}

function OS_focusNext(el)
{
	var focusable=$(el).find('input,select');

	var focused=focusable.filter(':focus').get(0);
	var next_index=focused.tabIndex+1;
	var best_match=null;

	focusable.each(function(i,element){
		if (!$(element).is(':disabled') && !typeof(element['tabIndex'])!=='undefined')
		{
			var tabindex=element.tabIndex+0;

			if (tabindex==next_index)
			{
				best_match=element;
				return false;
			}



			//if this tabindex is closer to the next_index,
			//then it becomes the new best match
			if (tabindex>next_index)
			{
				if ((best_match===null) || (tabindex<best_match.tabIndex))
					best_match=element;
			}

			//keep searching
		}
	});

	if (best_match!==null)
		OS_focus(best_match);


	return false;
}

function OS_check(id)
{
	var el=$(id);

	if (!el.is(':checked'))
	{
		el.attr('checked','checked');
		el.checkboxradio('refresh');
	}
}

function OS_enableWhen(el,val,id,type,focus)
{
	var source=$(el);
	var target=$(id);

	if (typeof target[type]!=="function")
	{
		console.error("Bad widget type",type,"for",target);
		return;
	}

	if (source.val()==val)
		OS_enable(target,type,focus);
	else
		OS_disable(target,type);
}

function OS_enableIf(el,cond,id,type,focus)
{
	var source=$(el);
	var target=$(id);

	if (source.is(cond))
		OS_enable(target,type,focus);
	else
		OS_disable(target,type);
}

function OS_enableIfAndWhen(el,cond,val,id,type,focus)
{
	var source=$(el);
	var target=$(id);

	if ((source.val()==val) && (source.is(cond)))
		OS_enable(target,type,focus);
	else
		OS_disable(target,type);
}

function OS_enable(id,type,focus)
{
	var target=$(id);

	if (typeof target[type]!=="function")
	{
		console.error("Bad widget type",type,"for",el);
		return;
	}

	target[type]('enable');

	if ((typeof(focus)!=='undefined') && focus)
	{
		var t=target;

		if (typeof(focus)==="string")
			t=target.filter(focus);

		OS_focus(t);
	}
}

function OS_disable(id,type)
{
	var target=$(id);

	if (typeof target[type]!=="function")
	{
		console.error("Bad widget type",type,"for",el);
		return;
	}

	target.val('');
	target[type]('disable');

	//when an element is disabled, hide its error label
	OS_hideError(target);
}

//returns the parent container, given a selector.
//the default selector is: .ui-controlgroup-controls
function OS_container(el,selector)
{
	var element=$(el);

	if (typeof selector === "undefined")
		selector=".ui-controlgroup-controls";

	return element.parents(selector).first();
}

function OS_checkboxgroup(el)
{
	var container=OS_container(el);

	return container.find('input[type=checkbox]');
}

function OS_hideError(el)
{
	$(el).parents('.ui-controlgroup-controls').find('.os-ui-error-label').hide();
}

function OS_getsetAttr(el,name,value)
{
	el=$(el);
	var aname='data-error-'+name;

	if (typeof(value)!=='undefined')
	{
		el.attr(aname,value);
		return value;
	}

	var a=el.attr(aname);

	if (typeof(a)==="undefined")
		return null;

	return a;
}

function OS_uniqueID(prefix)
{
	if (typeof(prefix)==="undefined")
		prefix="";

	return prefix+""+((new Date()).getTime())+""+Math.floor(Math.random()*42);
}

function OS_getsetID(el)
{
	el=$(el);
	var id=el.attr('id');

	if (typeof(id)==="undefined")
	{
		id=OS_uniqueID('os-gen-');
		el.attr('id',id);
	}

	return id;
}

function OS_setErrorPosition(el,pos,container,target)
{
	var error=$(el);

	pos=OS_getsetAttr(error,'pos',pos);

	//read the container either from the argument list, from a data attribute or auto-detect
	if (typeof(container)=="undefined")
	{
		var container_id=error.attr('data-error-container');

		if (typeof(container_id)!=="undefined")
			container=$('#'+container_id);
		else
			container=OS_container(error);
	}

	error.attr('data-error-container',OS_getsetID(container));

	//read the container either from the argument list, from a data attribute or make it the same as
	//the container
	if (typeof(target)=="undefined")
	{
		var target_id=error.attr('data-error-target');

		if (typeof(target_id)!=="undefined")
			target=$('#'+target_id);
		else
			target=container;
	}

	error.attr('data-error-target',OS_getsetID(target));

    switch (pos)
    {
		case 'top-right': 	error.css({
	                                'position':'absolute',
	                                'top':'-'+(error.outerHeight()+3)+'px',
	                                'left':(target.position().left+target.outerWidth(true)-error.outerWidth(true))+'px'
	                             });
	                		break;
		case 'top-left': 	error.css({
	                                'position':'absolute',
	                                'top':'-'+(error.outerHeight()+3)+'px',
	                                'left':(target.position().left)+'px'
	                             });
	                		break;
	   case 'mid-left': 	error.css({
                                    'position':'relative',
                                    'top':(target.height()/2 - error.height()/2 - 3)+'px',
                                    'left':'5px'
                                 });
                        	break;
       case 'outer-mid-left':
       						error.css({
       							'position':'absolute',
       							'top':(target.height()/2  - error.height()/2 + 2)+'px',
       							'left':(target.position().left - error.outerWidth() - 3)+'px'
       						})
    }
}

function OS_updateErrorPosition(errors)
{
	errors.each(function(i,e){
		OS_setErrorPosition(e);
	});
};

/** Displays the error label, based on the kind of element
 * Pass as callback to jQuery Validate plugin.
 * @param {Object} error The error label
 * @param {Object} element The element that caused the error
 */
function OS_onShowErrorLabel(error,element)
{
    error.addClass('ui-body ui-body-e ui-corner-all os-ui-error-label');

    var container=OS_container(element);
    var fieldset=container.parents('fieldset').first();

    switch (element.get(0).tagName.toLowerCase())
    {
        case 'select':
                error.addClass('ui-tooltip-bottom');
                container.prepend(error);
                OS_setErrorPosition(error,'top-left');
                break;
        case 'input':
                switch(element.attr('type'))
                {
                	case 'text':
                			container=element.parent();

                			error.addClass('ui-tooltip-right');
                			container.prepend(error);
                			OS_setErrorPosition(error,'outer-mid-left',container,element);
                			break;
                    case 'radio':
                            //horizontal radio group?
                            if (fieldset.hasClass('ui-controlgroup-horizontal'))
                            {
                                error.addClass('ui-tooltip-left');
                                container.append(error);
                                OS_setErrorPosition(error,'mid-left');
                            }
                            //vertical
                            else
                            {
                                error.addClass('ui-tooltip-bottom');
                                container.prepend(error);
                                OS_setErrorPosition(error,'top-left');
                            }
                            break;
                    case 'checkbox':
                                var existing_error=container.children('.os-ui-error-label');

                                if (existing_error.length)
                                {
                                    existing_error.show();
                                    break;
                                }

                                error.addClass('ui-tooltip-bottom');
                                container.prepend(error);
                                OS_setErrorPosition(error,'top-left');
                            break;
                    default:error.addClass('ui-tooltip-left');
                            container.append(error);
                }
                break;
    }
}

function OS_scrollTo(el,anim,container)
{
	el=$(el);

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

function OS_formToJSON(form)
{
	form=$(form);
	var elements=form.get(0).os_elements;

	var data=form.serializeArray();
	var result={};

	$(data).each(function(i,field){
		var name=field['name'];
		var value=field['value'];

		if (typeof(result[name])==="undefined")
		{
			//check if the name is for a checkbox and always make that an array
			if (elements.check.indexOf(name)!=-1)
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

/** Encrypts an object or a string.
 * Uses AES256 to encrypt the data with a random 32 character password.
 * Uses RSA(384-1024,configurable) to encrypt the password using the server's public key.
 *
 * @param {String|Object} data
 * @return False on Failure, Object(encrypted_password,encrypted_data) on Success
 */
function OS_encrypt(data,password)
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
			console.error('OS_encrypt: Failed to convert JSON to string',data,err.message);
			return false;
		}
	}
	var publicPEM=localStorage['key_pem'];

	if (typeof publicPEM==="undefined")
	{
		console.error('No public key.');
		return false;
	}

	if ((typeof localStorage['key_data']==='undefined') || !localStorage['key_data'].length)
	{
		//decode the public key
	    var asn=new pidCrypt.ASN1();
	    key=asn.decodePEM(publicPEM);

	    if (!key)
	    {
	    	console.error('Failed to decode PEM');
	    	return false;
    	}

		//store the decoded key
		localStorage['key_data']=JSON.stringify(key);
	}

	//read the key data
	var key;

	try
	{
		key=JSON.parse(localStorage['key_data']);
	}
	catch (err)
	{
		console.error('Failed to read key data',err.message);
		return false;
	}

    //generate a new password
    if (typeof password==='undefined')
    	password=OS_generatePassword();

    //aes encrypt data
    var aes=new pidCrypt.AES.CBC();
    var encrypted_data=aes.encryptText(data,password,{nBits:256});

    //encrypt password
    var rsa=new pidCrypt.RSA();
    rsa.setPublicKeyFromASN(key);

    var encrypted_password_hex=rsa.encryptRaw(password);
    password=""; //remove the password as soon as it is not needed

    var encrypted_password=pidCryptUtil.encodeBase64(pidCryptUtil.convertFromHex(encrypted_password_hex));

    return {
    	'password':encrypted_password,
    	'data':encrypted_data
    }
}

function OS_generatePassword(len)
{
	//using an array, because appending to strings tends to have n^2 behavior
	var result=[];

	if (typeof len === 'undefined')
		len=32;

	var alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()[]{};:,./<>? ';

	for (var i=0;i<len;++i)
	{
		var pos=Math.floor(Math.random()*alphabet.length);

		result.push(alphabet.charAt(pos));
	}

	return result.join('');
}

function OS_save(page)
{
	var forms=$(page).find('form[action]');
	var ok=true;

	//validate all forms
	forms.each(function(i,form){
	    if (!$(form).valid())
	    {
	        //scroll to the first element
	        OS_scrollTo($(form).find('.os-ui-error-label:visible').first(),true);

	        ok=false;

	        //stop looping over forms
	        return false;
	    }
	});

	if (ok)
	{
		//if all forms are valid, save all of them

		forms.each(function(i,form){
		    OS_saveForm(form);
		});
	}
}

function OS_saveForm(form)
{
    form=$(form);

    var id=window.localStorage['key_id'];
    var col=window.localStorage['collection'];
    var subject=window.localStorage['subject'];

    var payload={
        'collection':col,
        'subject':subject,
        'form':form.attr('data-form'),
        'version':form.attr('data-version'),
        'timestamp':(new Date().valueOf()),
        'data':OS_formToJSON(form)
    };

    var encrypted=OS_encrypt(payload);

    if (encrypted===false)
    {
        console.log('Failed to encrypt form data');
        return false;
    }

    //set the client id
    encrypted['id']=id;

    console.log('Sending:',encrypted,'to',form.attr('action'));

    AppCache_send(encrypted,window.localStorage['save-url']);
}
