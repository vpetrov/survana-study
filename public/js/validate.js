define([
        'jquery',
        'validation' //jquery plugin
       ],
function($)
{
    var all_rules={};

    function register(id,rules)
    {
        all_rules[id]=rules;

        console.log('form ',id,rules);
    }

    function init(id,el)
    {
        console.log('validate.init',id,el,all_rules[id]);

        $(el).validate({
            "rules":all_rules[id],
            "onsubmit":false,
            "onkeyup":false,
            "onclick":false,
            "onblur":true,
            //"onfocusout":true,
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

    /* must be used with the {'wrapper':'div'} config option for jQuery Validation plugin */
    function errorPlacement(error,el)
    {
        var controls=el.closest('.os-ui-container,.ui-controlgroup-controls').first();
        var label=controls;

        var btn=$('<a class="os-ui-button-mini os-ui-error os-ui-error-button os-ui-shadow" href="#" data-role="button" data-mini="true" data-inline="true" data-icon="alert" data-iconpos="notext" data-theme="e"></a>');

        error.children('label').first().addClass('ui-content ui-body ui-btn-up-e os-ui-tooltip os-ui-error os-ui-error-label ui-overlay-shadow ui-corner-all');
        error.append(btn);

        controls.prepend(error);
        btn.button();
        error.click(onTooltipClick);
    }

    function onTooltipClick(e)
    {
        var wrapper=$(e.currentTarget);
        wrapper.children('label').toggleClass('os-ui-hidden');
    }

    function clean()
    {
        errors={};
    }

    return {
        'register':register,
        'check':check,
        'init':init,
        'clean':clean
    }
});
