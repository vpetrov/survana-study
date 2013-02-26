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

        $.widget("mobile.slider", $.mobile.slider, {
            _create: function () {
                var labels;

                this._super();
                labels = this.slider.parent().next('table.s-slider-labels');

                //no labels?
                if (!labels.length) {
                    return;
                }

                this.slider.parent().css('height', 'auto');
                this.slider.after(labels);
            }
        });
    }
);
