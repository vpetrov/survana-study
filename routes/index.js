/*
 * GET home page.
 */
exports.index = function(req, res)
{
    res.render(req.views+'index');
};
