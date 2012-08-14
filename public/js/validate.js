define([
        'jquery',
        'validation' //jquery plugin
       ],
function($)
{
    var cache={};
    var all_rules={};

    $.validator.addMethod('can-ignore',function(value,element){
        return true;
    },'N/A')

    function register(id,rules)
    {
        all_rules[id]=rules;

        console.log('form ',id,rules);
    }

    function init(id,el)
    {
        console.log('validate.init',id,el,all_rules[id]);

        cache[id]=$(el).validate({
            "rules":all_rules[id],
            "ignore":"os-error-ignore",
            "onsubmit":false,
            "onfocusout":false,
            "onkeyup":false,
            "onclick":false,
            "focusInvalid":false,
            "errorClass":"os-ui-error",
            "wrapper":'div',
            "errorPlacement":errorPlacement
        });
    }

    function check(form)
    {
        console.log("validating form");

        if ($(form).valid())
        {
            console.log('form is valid!');
            return true;
        }
        else
            console.log('form is not valid');

        return false;
    }

    function checkField(form_id,f)
    {
        if (typeof(cache[form_id])==='undefined')
            throw Error('Form '+form_id+' has not been registered with the validator');

        var validator=cache[form_id];
        return validator.element(f);
    }

    /* must be used with the {'wrapper':'div'} config option for jQuery Validation plugin */
    function errorPlacement(error,el)
    {
        //todo: figure out a way to get these values from a config
        var error_theme='e';
        var error_btn_theme='e';
        var ignore_btn_theme='c';
        error.css('display','inline'); //keeps inline inputs from being pushed down one row

        var rules=el.rules(); //per-element option to allow user to ignore errors
        var controls=el.closest('.os-ui-container,.ui-controlgroup-controls').first();

        var btn=$('<a class="os-ui-button-mini os-ui-error os-ui-error-button" href="#" data-role="button" data-mini="true" data-inline="true" data-icon="alert" data-iconpos="notext" data-theme="'+error_btn_theme+'"></a>');
        var label=error.children('label').first();
        label.addClass('ui-content ui-body ui-btn-up-'+error_theme+' os-ui-tooltip os-ui-error os-ui-error-label ui-overlay-shadow ui-corner-all');

        error.append(btn);

        //allow user to ignore errors for this field?
        if (rules['can-ignore'])
        {
            //ignore button is larger than the warning button, so the label needs more padding on the right
            label.addClass('os-ui-error-label-far');
            //the warning button should be hidden by default (will be displayed again when the label is hidden)
            btn.addClass('os-ui-hidden');
            //create an ignore button
            var btnIgnore=$('<a class="os-ui-error os-ui-error-button" href="#" data-role="button" data-mini="true" data-inline="true" data-theme="'+ignore_btn_theme+'">Ignore</a>');
            //append button to the error container
            error.append(btnIgnore);
            //create jqm button object
            btnIgnore.button();
            //half-hack: store the element in the button's DOM object
            btnIgnore.get(0).ignoreEl=el;
            //register the click handler
            btnIgnore.click(onIgnoreClick);
        }
        else
            //if not, then just set enough padding on the label to make room for the warning button
            label.addClass('os-ui-error-label-near');

        //errors are positioned absolute-ly, but they tend to be the first item in their container (at least visually)
        controls.prepend(error);
        //create the jqm object for the warning button
        btn.button();
        //register click handler
        error.click(onTooltipClick);
    }

    function onTooltipClick(e)
    {
        var wrapper=$(e.currentTarget);
        var label=wrapper.children('label')
        var buttons=wrapper.children('a.os-ui-error-button');

        //show
        label.toggleClass('os-ui-hidden');

        //more than 1 button? assume the hidden/visible classes are set up for toggling
        if (buttons.length>1)
            buttons.toggleClass('os-ui-hidden');
    }

    function onIgnoreClick(e)
    {
        var btn=e.currentTarget;
        var element=$(btn.ignoreEl);
        var rules=element.rules("remove","required");

        element.addClass('os-error-ignore');

        //hide the message (and the warning button).
        $(btn).parent().addClass('os-ui-hidden');
    }

    function clean()
    {
        errors={};
    }

    return {
        'register':register,
        'check':check,
        'checkField':checkField,
        'init':init,
        'clean':clean
    }
});
