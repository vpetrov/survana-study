/** routes/index.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

/*
 * GET home page.
 */
exports.index = function (req, res) {
    "use strict";

    res.render(req.views + 'index', {
        'canClose': true
    });
};
