/** public/js/box.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

define(
    [
        'jquery',
        'jquery.mobile',
        'jqm',
        'validate'
    ],
    function ($, $m, JQM, Validate) {
        "use strict";

        function onRemove(e) {
            var button = $(e.currentTarget),
                box_id = button.attr('data-box'),
                list_item = button.parentsUntil('ul', 'li').first();

            //jqm 1.3.0-beta.1 doesn't set 'ui-last-child' when the last item is removed and
            //listview('refresh') is called
            if (list_item.is(':last-child')){
                list_item.prev().addClass('ui-last-child');
            }

            list_item.remove();

            $('#' + box_id).listview('refresh');

            e.preventDefault();
            return false;
        }

        function add(box_id, items) {
            var box         = items.filter('ul').first(),
                labels      = items.filter('label'),
                newitems    = [],
                title       = '',
                list_item   = $('<li></li>'),
                remove      = $('<a>Remove</a>'),
                invalid     = false;


            //only leave those elements that can contain values
            items = items.filter('input,select,textarea');

            if (!box) {
                console.error('Box', box_id, ' does not exist.');
                return;
            }

            items.each(function () {
                var hidden = $('<input type="hidden">').get(0),
                    label = labels.filter('[for=' + this.id + ']').first().html();

                hidden.value = this.value;
                hidden.name = this.name;

                title += '<span class="s-box-item ui-bar-c ui-corner-all">' + label + '<strong>' + String(this.value) +
                         '</strong></span> ';

                newitems.push(hidden);
            });

            //clear all items, except hidden elements, and do not trigger 'change' events for cleared elements
            JQM.clear(items.not('input:hidden'));

            newitems.push($('<a>' + title + '</a>').get(0));
            newitems.push(remove.get(0));

            $(newitems).appendTo(list_item);
            box.append(list_item);

            remove.click(onRemove);

            box.listview('refresh');
        }

        /**
         * Callback for when the user clicks an Add button, to insert elements into a 'box'
         * @param e {Event}
         */
        function onAdd(e) {

            var button = $(e.currentTarget),
                box_id = button.attr('data-box'),
                items       = $.mobile.activePage.find('[data-box=' + box_id + ']');

            add(box_id, items);

            e.preventDefault();
            return false;
        }

        return {
            'add':      add,
            'onAdd':    onAdd,
            'onRemove': onRemove
        };
    }
);
