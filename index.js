/** app must have 'log' and 'dirname' properties */

var name=require("./package.json").name;

exports.config=require('./config');

//request helpers
function routing(app,config)
{
    //detect mobile browsers
    app.get('*',function(req,res,next)
    {
        var user_agent=req.header('user-agent').toLowerCase();

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
            req.views=config.views.mobile+'/';
        }
        else
        {
            req.mobile=false;
            req.views=config.views.desktop+'/';
        }

        next();
    });
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

    routing(app,mconfig);

    //set up routes
    survana.routing(app,this.config.routes);

	app.log.info('reporting in!');

    //make properties easily accessible from the 'app' object
	app.config=mconfig;
	app.dbserver=new survana.db(this.config.db);

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
