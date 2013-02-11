/** public/js/validate.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define([
    'jquery',
    'validation' //jquery plugin
],
    function ($) {
        "use strict";

        var cache = {},
            errors = {},
            all_rules = {};

        function register(id, rules) {
            all_rules[id] = rules;

            console.log('form ', id, rules);
        }

        function check(form) {
            console.log("validating form");

            if ($(form).valid()) {
                console.log('form is valid!');
                return true;
            }

            console.log('form is not valid');
            return false;
        }

        function checkField(form_id, f) {
            var validator;

            if (cache[form_id] === undefined) {
                console.error('Form ' + form_id + ' has not been registered with the validator');
                return false;
            }

            validator = cache[form_id];

            if (!validator) {
                return false;
            }

            return validator.element(f);
        }

        function onSkipClick(e) {
            var btn = e.currentTarget,
                element = $(btn.ignoreEl);

            element.rules("remove", "required");
            element.addClass('s-error-ignore s-skipped');

            //hide the message (and the warning button).
            //todo: this is not working properly for Skip buttons on Firefox (it seems there is a different parent that
            //should be selected instead)
            $(btn).parent().addClass('s-hidden');
        }

        function onTooltipClick(e) {
            var wrapper = $(e.currentTarget),
                label = wrapper.children('label'),
                buttons = wrapper.children('a.s-error-button');

            //show
            label.toggleClass('s-hidden');

            //more than 1 button? assume the hidden/visible classes are set up for toggling
            if (buttons.length > 1) {
                buttons.toggleClass('s-hidden');
            }
        }


        /* must be used with the {'wrapper':'div'} config option for jQuery Validation plugin */
        function errorPlacement(error, el) {
            //todo: figure out a way to get these values from a config
            var theme = {
                    error:  'e',
                    'btn':  'e',
                    'skip': 'c'
                },
                rules = el.rules(), //per-element option to allow user to ignore errors
                controls = el.parents('.s-input-container').last(),
                btn = $('<a class="s-button-mini s-error s-error-button" href="#" data-role="button" data-mini="true"' +
                        ' data-inline="true" data-icon="alert" data-iconpos="notext" data-theme="' + theme.btn +
                        '"></a>'),
                label = error.children('label').first(),
                btnSkip;

            label.addClass('ui-content ui-body ui-btn-up-' + theme.error +
                           ' s-tooltip s-error s-error-label ui-overlay-shadow ui-corner-all');

            error.css('display', 'inline'); //keeps inline inputs from being pushed down one row
            error.append(btn);

            //allow user to ignore errors for this field?
            if (rules.skip) {
                //ignore button is larger than the warning button, so the label needs more padding on the right
                label.addClass('s-error-label-far');
                //the warning button should be hidden by default (will be displayed again when the label is hidden)
                btn.addClass('s-hidden');
                //create a Skip button
                btnSkip = $('<a class="s-error s-error-button s-skip" href="#" data-role="button" data-mini="true" ' +
                            'data-inline="true" data-icon="check" data-iconpos="right" data-theme="' + theme.skip +
                            '">Skip</a>');
                //append button to the error container
                error.append(btnSkip);
                //create jqm button object
                btnSkip.button();
                //half-hack: store the element in the button's DOM object
                btnSkip.get(0).ignoreEl = el;
                //register the click handler
                btnSkip.click(onSkipClick);
            } else {
            //if not, then just set enough padding on the label to make room for the warning button
                label.addClass('s-error-label-near');
            }

            //errors are positioned absolutely, but they tend to be the first item (visually) in their container
            controls.prepend(error);
            //create the jqm object for the warning button
            btn.button();
            //register click handler
            error.click(onTooltipClick);
        }

        function init(id, el) {
            console.log('validate.init', id, el, all_rules[id]);

            cache[id] = $(el).validate({
                "rules": all_rules[id]
            });
        }


        function clean() {
            errors = {};
        }

        //set default validation options
        $.validator.setDefaults({
            "ignore": ".s-error-ignore",
            "ignoreTitle": true,
            "onsubmit": false,
            "onfocusout": false,
            "onkeyup": false,
            "onclick": false,
            "focusInvalid": false,
            "errorClass": "s-error",
            "wrapper": 'div',
            "errorPlacement": errorPlacement
        });

        //override default message
        jQuery.extend(jQuery.validator.messages, {
            required: 'This field is missing.',
            min: 'This value is too low.',
            max: 'This value is too high.'
        });

        // callback takes 'value' and 'element' params
        $.validator.addMethod('skip', function () {
            return true;
        }, 'N/A');

        //public API
        return {
            'register': register,
            'check': check,
            'checkField': checkField,
            'init': init,
            'clean': clean
        };
    });
