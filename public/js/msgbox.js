/**

 <div data-role="content" data-theme="d" class="ui-corner-bottom ui-content">
 <h3 class="ui-title" id="messagebox-title">Are you sure?</h3>
 <p id="messagebox-message">&nbsp;</p>
 <a href="#" data-role="button" data-rel="back" data-theme="b" data-inline="true" data-icon="back" data-transition="flow">Ok</a>
 </div>
 </div>
 */

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

        function create() {
            var msgbox = $('<div data-role="popup" data-overlay-theme="a" data-theme="b" style="max-width:400px;" class="s-msgbox ui-corner-all">'),
                header = $('<div data-role="header" data-theme="a" class="ui-corner-top"></div>'),
                content = $('<div data-role="content" data-theme="c" class="ui-corner-bottom ui-content"></div>'),
                title = $('<h3 class="ui-title s-msgbox-title">&nbsp;</h3>'),
                message = $('<p class="s-msgbox-message">&nbsp;</p>'),
                button = $('<a href="#" data-role="button" data-rel="back" data-theme="b" data-inline="true" data-icon="back" data-transition="flow">Ok</a>');

            content.append(title);
            content.append(message);
            content.append(button);

            msgbox.append(header);
            msgbox.append(content);

            $.mobile.activePage.find('div[data-role=content]').first().append(msgbox);
            msgbox.popup();

            return msgbox;
        }

        function get() {
            var msgbox = $.mobile.activePage.find('.s-msgbox');

            if (!msgbox.length) {
                msgbox = create();
            }

            return msgbox;
        }

        function show(message, title) {
            var msgbox = get();

            msgbox.find('.s-msgbox-message').html(message);
            msgbox.find('.s-msgbox-title').html(title);
            msgbox.find('a').button();
            msgbox.popup('open');
        }

        return {
            'create':   create,
            'get':      get,
            'show':     show
        };
    }
);
