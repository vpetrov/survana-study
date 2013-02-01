/** index.js
 *
 * @author Victor Petrov <victor.petrov@gmail.com>
 * @copyright (c) 2012, The Neuroinformatics Research Group at Harvard University.
 * @copyright (c) 2012, The President and Fellows of Harvard College.
 * @license New BSD License (see LICENSE file for details).
 */

/** app must have 'log' and 'dirname' properties */

var name=require("./package.json").name;

exports.config=require('./config');


function detectBrowser(req, res, next)
{
    var user_agent=req.header('user-agent');

    //by default, assume desktop client
    req.mobile=false;
    req.views=req.app.config.views.desktop+'/';

    //attempt to detect mobile client
    if (user_agent) {

        user_agent=user_agent.toLowerCase();

        if ((user_agent.indexOf('mobile')>-1) ||
            //RIM,Nokia,SonyEricsson,etc:
            (user_agent.indexOf('tablet')>-1) ||
            (user_agent.indexOf('symbian')>-1)||
            (user_agent.indexOf('fennec')>-1) ||
            (user_agent.indexOf('gobrowser')>-1) ||
            (user_agent.indexOf('maemo')>-1) ||
            (user_agent.indexOf('opera mini')>-1) ||
            (user_agent.indexOf('opera mobi')>-1) ||
            (user_agent.indexOf('semc-browser')>-1)
            )
        {
            req.mobile=true;
            req.views=req.app.config.views.mobile+'/';
        }
    }

    //continue
    next();
}

//request helpers
function routing(app)
{
    //detect mobile browsers
    app.get('*',detectBrowser);
    app.post('*',detectBrowser);
}

exports.server=function(survana,express)
{
	var app=this.app=express.createServer();
    var mconfig=this.config;

	app.configure(function()
	{
		app.set('views', __dirname + '/views');
		app.set('view engine','ejs');
		app.set('view options',{
			layout:true
		});

        app.use(express.methodOverride());
        app.use(express.bodyParser());
        //static routes come before app.router, since there is no need to intercept requests to static files
        app.use(express.static(__dirname+'/public'));
        app.use(app.router);

        //global view helpers
        app.locals({
            config:mconfig      //all views have access to the config
        });

        app.log=survana.log.sub(name);
        app.dirname=__dirname;
    });

    //make properties easily accessible from the 'app' object
    app.config=mconfig;

    routing(app);

    //set up routes
    survana.routing(app,this.config);

	app.log.info('reporting in!');


	app.dbserver=new survana.db(this.config.db);

    //load keys for all known admins
    app.config.admins=survana.readKeys(app.config.admins);

	//open a database connection
	app.dbserver.connect(function(db){
		app.db=db;
	},
	function(error){
		throw error;
	});

	return this.app;
};

exports.error=function(err,req,res,next)
{
    res.send('Module '+name+' error handler!');
}
