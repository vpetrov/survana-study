/** public/js/jqm.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */
define(
    [
        'jquery',
        'jquery.mobile'
    ],
    function ($) {
        "use strict";

        /**
         * Returns the jQuery Mobile UI function for changing the 'el' object
         * @param el {jQuery Object}
         * @return {String}
         */
        function getType(el) {
            if (!el.length) {
                return null;
            }

            switch (el.get(0).tagName.toLowerCase()) {
            case 'input':   //check the type of the element
                switch (el.attr('type').toLowerCase()) {
                case 'radio':
                case 'checkbox':
                    return 'checkboxradio';

                case 'range':
                    return 'slider';

                case 'number':
                    if (el.attr('data-type') === 'range') {
                        return 'slider';
                    }
                    //else textinput
                case 'email':
                case 'password':
                case 'text':
                    return 'textinput';
                }
                break;

            case 'select':
                if (el.attr('data-role') === 'slider') {
                    return 'slider';
                }

                return 'selectmenu';

            default:
                console.error('jqm: unknown element kind:', el);
            }

            return null;
        }

        /**
         * Clears a specific jqm field
         * @param f {jQuery Object}
         * @param trigger {Boolean} Whether a 'change' event should be triggered or not (default: true)
         * @param jqmMethod {String} The name of the jQuery Mobile function to use. (default: call getType())
         */
        function clearField(f, trigger, jqmMethod) {
            var el = f.get(0);

            //default value of jqmMethod is what is returned by getType()
            if (!jqmMethod) {
                jqmMethod = getType(f);
            }

            //default value of trigger is true
            if (trigger === undefined) {
                trigger = true;
            }

            //note: couldn't get jquery mobile to use .val() to update select values, so this hack uses the raw html
            //select and its 'selectedIndex' property, and then fires a 'change' even on that select, which is then
            //handled by jquery mobile to update the UI.
            if (jqmMethod === 'selectmenu') {
                if (!el.disabled && (el.selectedIndex !== 0)) {
                    el.selectedIndex = 0;
                }
                f[jqmMethod]('refresh');
            } else if (jqmMethod === 'checkboxradio') {
                f.prop('checked', false);
                f[jqmMethod]('refresh');
            } else if (jqmMethod === 'slider') {
                f.val(0); //before refreshing, make sure the value is 0
                f[jqmMethod]('refresh');
                f.val(''); //make sure the box is empty
            } else {
                f.val('');
            }

            if (trigger) {
                f.trigger('change');
            }
        }

        /**
         * Clears the value of all elements in the context
         * @param context A jQuery array of elements. Defaults to the active page
         * @param trigger {Boolean} Trigger 'change' event; default: false
         */
        function clear(context, trigger) {
            if (!context) {
                context = $.mobile.activePage.find('input,select,textarea');
            }

            if (trigger === undefined) {
                trigger = false;
            }

            context.filter('form').each(function (i, f) {
                f.reset();
            });

            context.each(function () {
                clearField($(this), trigger);
            });
        }

        function toContext(form_data) {
            var result = {},
                field,
                id,
                i;

            for (i in form_data) {
                if (form_data.hasOwnProperty(i)) {
                    field = form_data[i];
                    id = field.name || field.id;

                    //no name or id? skip field.
                    if (id === undefined) {
                        continue;
                    }

                    if (result[id] === undefined) {
                        result[id] = field.value;
                    } else if ($.isArray(result[id])) {
                        result[id].push(field.value);
                    } else {
                        //transform value to array
                        result[id] = [result[id]];
                        //append new value
                        result[id].push(field.value);
                    }
                }
            }

            return result;
        }

        function enableField(el) {
            var field = $(el.target),
                jqm_method;

            el = $(el);
            jqm_method = getType(el);

            if (jqm_method) {
                el[jqm_method]('enable');
            }

            if (el.is('input')) {
                el.removeAttr('disabled');
            }
        }

        function disableField(el) {
            var field = $(el.target),
                jqm_method;

            el = $(el);
            jqm_method = getType(el);

            clearField(el,false,jqm_method);

            if (jqm_method) {
                el[jqm_method]('disable');
            }

            if (el.is('input')) {
                el.attr('disabled', 'disabled');
            }

            //if the field has an error attached to it
            if (field.hasClass('s-error')) {
                //find the first container element (since errors will be attached to parent container)
                //then find all warning buttons (because one could have embedded errors) and remove the wrapper
                //element
                field.closest('.ui-controlgroup-controls,li[data-role=fieldcontain]')
                    .first()
                    .find('a.s-error').each(function (i, error) {
                        $(error).parent().remove();
                    });
                field.removeClass('s-error');
            }
        }

        return {
            'clear':        clear,
            'clearField':   clearField,
            'enableField':  enableField,
            'disableField': disableField,
            'getType':      getType,
            'toContext':    toContext
        };
    }
);
