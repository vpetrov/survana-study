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
    'crypto',
    'box',
    'jqm',
    'storage',
    'msgbox'
],
    function ($, $m, Workflow, AppCache, Depend, Validate, Bind, Crypto, Box, JQM, Store, MsgBox) {
        "use strict";

        function checkPrerequisites() {
            //check for JSON
            if (JSON === undefined) {
                return "Your browser does not support JSON objects.";
            }

            //check for JSON stringify
            if ((typeof JSON.stringify !== 'function') || (typeof JSON.parse !== 'function')) {
                return "Your browser cannot read and write JSON objects.";
            }

            return true;
        }

        function gotoPage(url) {
            if (!url) {
                console.error('Invalid page URL', url);
                return false;
            }

            console.log('Changing page to:', url);
            $.mobile.changePage(url, {
                'allowSamePageTransition': false,
                'transition': 'none'
            });

            return true;
        }

        function gotoNextPage() {
            var url = Workflow.nextUrl();

            if (!url) {
                return false;
            }

            return gotoPage(url);
        }

        function reset() {
            Workflow.reset();
            gotoNextPage();
        }

        function resume() {
            var index = Workflow.getCurrentIndex(),
                url;

            if (index === null) {
                return false;
            }

            if (index < 0) {
                reset();
            } else {
                url = Workflow.getUrl(index);
                if (url) {
                    gotoPage(url);
                }
            }

            return true;
        }

        function logevent(e) {
            var page = e.target;

            console.log(e.type, page.id, arguments);
        }

        function action(el, actions) {
            var action_name,
                action_data,
                elements,
                i;

            el = $(el, $.mobile.activePage);

            if (!el.length) {
                console.error('Survana action: element could not be found', el);
                return false;
            }

            if (!$.isArray(actions)) {
                actions = [actions];
            }

            for (i in actions) {
                if (actions.hasOwnProperty(i)) {

                    if ((typeof actions[i] === 'object') && (actions[i].action !== undefined)) {
                        action_name = actions[i].action;
                        delete actions[i].action;
                        //the rest of the object will serve as 'options'
                        action_data = actions[i];
                    } else {
                        action_name = actions[i];
                    }

                    switch (action_name) {

                    //clear
                    case 'clear':
                        JQM.clearField(el, false);
                        break;

                    //enable
                    case 'enable':
                        JQM.enableField(el);
                        break;

                    //disable
                    case 'disable':
                        JQM.clearField(el, false);
                        JQM.disableField(el);
                        break;

                    //focus
                    case 'focus':
                        if (!el.first().is(':focus')) {
                            el.first().not(':radio').not(':checkbox').focus();
                        }
                        break;

                    //blur
                    case 'blur':
                        if (el.first().is(':focus')) {
                            el.first().blur();
                        }
                        break;

                    //show
                    case 'show':
                        //make sure the element is enabled
                        action(el, 'enable');

                        elements = el.closest('li[data-role=fieldcontain]');

                        //add previous question, if it exists
                        if (elements.prev().hasClass('s-question')) {
                            elements = elements.add(elements.prev());
                        }

                        elements.show();
                        break;

                    //hide
                    case 'hide':
                        elements = el.closest('li[data-role=fieldcontain]');

                        //add previous question, if it exists
                        if (elements.prev().hasClass('s-question')) {
                            elements = elements.add(elements.prev());
                        }

                        elements.hide();

                        //make sure the element is disabled
                        action(el, 'disable');
                        break;

                    case 'message':
                        if (action_data.message) {
                            MsgBox.show(action_data.message, action_data.title || 'Message');
                        }
                        break;

                    case 'hidenext':
                        $.mobile.activePage.find('.btn-next').first().hide();
                        break;

                    case 'shownext':
                        $.mobile.activePage.find('.btn-next').first().show();
                        break;
                    }
                }
            }

            return true;
        }

        function dependAction(field_name, actions) {
            return action('[name=' + field_name + ']', actions);
        }

        function dependCheck(changed) {
            var form_id = $.mobile.activePage.attr('data-form'),
                data = $.mobile.activePage.find('form#' + form_id).serializeArray();

            //check all field dependencies
            //todo: build a dependency graph and only check those fields that are impacted by this change
            Depend.check(form_id, JQM.toContext(data), changed);
        }



        function onPageSave(e) {
            logevent(e);
        }

        function onPageBeforeLoad(e) {
            logevent(e);
        }

        function onPageLoad(e) {
            logevent(e);
        }

        function onPageLoadFailed(e) {
            logevent(e);
        }

        function onPageBeforeChange(e) {
            logevent(e);
        }

        function onPageChange(e, options) {
            logevent(e);
            console.log('options', options);
        }

        function onPageChangeFailed(e) {
            logevent(e);
        }

        function onPageBeforeHide(e) {

            var page = $(e.target);
            logevent(e);

            if (page.attr('data-role') === 'dialog') {
                return;
            }

            JQM.clear();
            Validate.clean();
        }

        function onPageHide(e) {
            logevent(e);
        }

        function onPageBeforeCreate(e) {
            logevent(e);
        }

        function onPageCreate(e) {
            logevent(e);
        }

        function onPageShow(e) {

            var page = $(e.target);

            if (page.attr('data-role') === 'dialog') {
                return;
            }

            Store.put('form-timestamp', (new Date()).valueOf());

            logevent(e);
        }

        function onPageRemove(e) {
            logevent(e);
        }

        function onPageUpdateLayout(e) {
            logevent(e);
        }

        function onFieldChanged(e) {
            logevent(e);
            var target = $(e.target),
                form_id = $.mobile.activePage.attr('data-form');
            dependCheck(target.attr('name'));
            Validate.checkField(form_id, target);
            Bind.field(form_id, target);
        }

        function validate() {
            var result = true;

            $.mobile.activePage.find('form').each(function (i, f) {
                if (!Validate.check(f)) {
                    result = false;
                }
            });

            return result;
        }

        function formToJSON(form) {
            var data,
                result = {},
                checkboxes = [];

            form = $(form);
            //var elements=form.get(0).os_elements;

            checkboxes = [];
            //find all checkboxes
            form.find('input[type=checkbox]').each(function (i, el) {
                if (el.name) {
                    checkboxes.push(el.name);
                }
            });

            data = form.serializeArray();

            $(data).each(function (i, field) {
                var name = field.name,
                    value = field.value,
                    original_value,
                    el = $(form.get(0).elements[name]);

                if (el.hasClass('s-skipped')) {
                    value = {
                        value: value,
                        skipped: true
                    };
                }

                //ignore empty values
                if (value === '') {
                    return;
                }

                if (result[name] === undefined) {
                    //check if the name is for a checkbox and always make that an array
                    if (checkboxes.indexOf(name) !== -1) {
                        result[name] = [value];
                    } else {
                        result[name] = value;
                    }
                } else {
                    if (!$.isArray(result[name])) {
                        //convert the value to an array
                        original_value = result[name];
                        result[name] = [original_value];
                    }

                    //store new value
                    result[name].push(value);
                }
            });

            return result;
        }

        /** Encrypts an object or a string.
         * Uses AES256 to encrypt the data with a random 32 character password.
         * Uses RSA(384-1024,configurable) to encrypt the password using the server's public key.
         * @param data {String|Object}
         * @param password
         * @return {Boolean} False on Failure, Object(encrypted_password,encrypted_data) on Success
         */
        function encrypt(data, password) {
            var key = null;

            if (data === undefined) {
                return false;
            }

            if (typeof data === "object") {
                try {
                    data = JSON.stringify(data);
                } catch (convert_err) {
                    console.error('Failed to convert JSON to string', data, convert_err.message);
                    return false;
                }
            }

            //decide whether the public key needs to be decoded
            if (Store.has('key-data')) {
                //read the key data from localStorage
                try {
                    key = JSON.parse(Store.get('key-data'));
                } catch (key_err) {
                    console.error('Failed to read key data', key_err.message);
                    return false;
                }
            } else {
                key = Crypto.decodeKey(Store.get('key-pem'));

                if (!key) {
                    console.error('failed to decode public key', Store.get('key-pem'));
                    return false;
                }

                //store the decoded key
                Store.put('key-data', JSON.stringify(key));
            }

            return Crypto.encrypt(data, key, password);
        }

        function save(success) {
            var url = String($.mobile.activePage.attr('data-store') || Store.get('store-url')).trim(),
                payload,
                packet;

            $.mobile.activePage.find('form').each(function (i, f) {

                payload = {
                    'id': {
                        'survana':  Store.get('survana-id'),
                        'study':    window['study-id'],
                        'form':     f.id,
                        'session':  Store.get('session-id') + ":" + Store.get('session'),
                        'key':      Store.get('key-id')
                    },
                    'timestamp': {
                        'server_session':   Store.get('session-timestamp'),
                        'client_session':   Store.get('session-timestamp-client'),
                        'form_start':       Store.get('form-timestamp'),
                        'form_end':         (new Date()).valueOf().toString()
                    },
                    'data': formToJSON(f)
                };

                console.log('data to be saved', payload);

                packet = {
                    'key': {
                        'id':   Store.get('key-id'),
                        'pem':  Store.get('key-pem'),
                        'bits': Store.get('key-bits')
                    },
                    'payload': encrypt(payload)
                };

                console.log('Saving form', packet);

                AppCache.send(packet, url);
            });

            success();
        }


        function scrollTo(el, anim, container) {
            var vpheight,
                elheight,
                scroll_y;

            el = $(el, $.mobile.activePage);

            if (!el.length) {
                return;
            }

            if (container === undefined) {
                container = $('body,html');
            } else {
                container = $(container, $.mobile.activePage);
            }

            vpheight = container.height();
            elheight = el.height();
            scroll_y = el.offset().top + (elheight / 2) - (vpheight / 2);

            if (anim) {
                container.animate({
                    scrollTop: scroll_y
                });
            } else {
                container.scrollTop(scroll_y);
            }
        }

        function hideLoadingMessage() {
            $.mobile.loading('hide');
        }

        function showLoadingMessage(message) {
            $.mobile.loading('show', {
                theme:  'a',
                text:   message,
                textVisible: true
            });
        }

        function closeSurvey() {
            if (Workflow.willWrap()) {
                gotoNextPage();
            } else {
                //since this is a 1 time survey, remove the save button, clear the local storage (except for any
                //appcache items) and inform the user that his journey is over.
                $.mobile.activePage.find('.btn-save').remove();
                Store.clear();
                window.canClose = 1;
                MsgBox.show('Your responses have been successfully saved.',
                            'Thank you very much for your participation.');
            }
        }

        function saveFailed() {
            MsgBox.show('We were unable to store your responses.',
                        'Please check the network connection and press Finish to try again.');
        }

        function finishSurvey() {
            var nitems = AppCache.count(),
                timeout = 60,
                timer,
                button = $.mobile.activePage.find('button.btn-save');

            button.button('disable');

            JQM.clear();
            Validate.clean();

            if (!nitems) {
                button.removeAttr('data-retry');
                closeSurvey();
            } else {
                timer = setInterval(function () {

                    timeout--;

                    //timed out?
                    if (timeout <= 0) {
                        clearInterval(timer);
                        hideLoadingMessage();
                        button.attr('data-retry', 1);
                        button.button('enable');
                        saveFailed();
                    } else {
                        nitems = AppCache.count();

                        if (!nitems) {
                            clearInterval(timer);
                            hideLoadingMessage();
                            button.removeAttr('data-retry');
                            closeSurvey();
                        } else {
                            showLoadingMessage('Please wait ' + timeout + ' seconds while we store your responses (' +
                                               nitems + ' left)');
                        }

                    }
                }, 1000);

            }
        }

        function onSaveClick(e) {
            var preview = $.mobile.activePage.attr('data-preview'),
                button = $(e.currentTarget);

            if (validate() && !preview) {
                if (button.attr('data-retry')) {
                    finishSurvey();
                } else {
                    save(finishSurvey);
                }
            } else {
                scrollTo($.mobile.activePage.find('.s-error-button:visible').first(), true);
            }
        }

        function onPageBeforeShow(e) {
            var buttons;

            logevent(e);

            if (!Workflow.willWrap() && Workflow.isLast()) {
                buttons = $.mobile.activePage.find('a.btn-next,a.btn-save');
                buttons.filter('a.btn-next:not(.btn-preview)').css('display', 'none');
                buttons.filter('a.btn-save').css('display', '').click(onSaveClick);
            }
        }

        /**
         * Takes an unused parameter e:Event
         */
        function onNextClick() {
            var preview = $.mobile.activePage.attr('data-preview');

            if (validate() && !preview) {
                save(gotoNextPage);
            } else {
                scrollTo($.mobile.activePage.find('.s-error-button:visible').first(), true);
            }
        }

        /**
         * Callback for when the user clicks an Add button, to insert elements into a 'box'
         * @param e {Event}
         */
        function onBoxAdd(e) {
            var button = $(e.currentTarget),
                box_id = button.attr('data-box'),
                form_id = $.mobile.activePage.attr('data-form'),
                items   = $.mobile.activePage.find('[data-box=' + box_id + ']'),
                valid   = true;


            //validate all input items before adding them to the 'box'
            items.filter('input,select,textarea').each(function (idx, item) {
                if (!Validate.checkField(form_id, $(item).get(0))) {
                    valid = false;
                }
            });

            if (valid) {
                Box.add(box_id, items);
            }

            e.preventDefault();
            return false;
        }

        function onPageInit(e) {

            var page = $(e.target);

            logevent(e);

            page.css('visibility', '');

            if (page.attr('data-role') === 'dialog') {
                return;
            }

            page.find('a.btn-next').click(onNextClick);
            page.find('input,select,textarea').change(onFieldChanged);
            page.find('button[data-box]').click(onBoxAdd);

            page.find('form').each(function (i, f) {
                Validate.init(f.id, f);
            });
        }

        return {
            'Depend':               Depend,
            'Validate':             Validate,
            'Bind':                 Bind,
            'Box':                  Box,
            'checkPrerequisites':   checkPrerequisites,
            'reset':                reset,
            'resume':               resume,
            'gotoPage':             gotoPage,
            'gotoNextPage':         gotoNextPage,
            'onPageSave':           onPageSave,
            'onPageBeforeLoad':     onPageBeforeLoad,
            'onPageLoad':           onPageLoad,
            'onPageLoadFailed':     onPageLoadFailed,
            'onPageBeforeChange':   onPageBeforeChange,
            'onPageChange':         onPageChange,
            'onPageChangeFailed':   onPageChangeFailed,
            'onPageBeforeShow':     onPageBeforeShow,
            'onPageBeforeHide':     onPageBeforeHide,
            'onPageHide':           onPageHide,
            'onPageBeforeCreate':   onPageBeforeCreate,
            'onPageCreate':         onPageCreate,
            'onPageInit':           onPageInit,
            'onPageShow':           onPageShow,
            'onPageRemove':         onPageRemove,
            'onPageUpdateLayout':   onPageUpdateLayout,
            'onFieldChanged':       onFieldChanged,
            'onNextClick':          onNextClick,
            'action':               action,
            'dependAction':         dependAction,
            'scrollTo':             scrollTo,
            'formToJSON':           formToJSON,
            'validate':             validate
        };
    }
    );
