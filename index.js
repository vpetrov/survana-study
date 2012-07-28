/** app must have 'log' and 'dirname' properties */

var name=require("./package.json").name;

exports.config=require('./config');


exports.server=function(idata,express)
{
	var app=this.app=express.createServer();

	app.configure(function()
	{
		app.set('views', __dirname + '/views');
		app.set('view engine','ejs');
		app.set('view options',{
			layout:false
		});

        app.use(express.methodOverride());
        app.use(express.bodyParser());
        app.use(app.router);
        app.use(express.static(__dirname+'/public'));

        app.log=idata.log.sub(name);
        app.dirname=__dirname;
    });

    app.configure('dev',function(){
    	app.use(express.errorHandler({
    		dumpExceptions:true,
    		showStack:true
    	}))
    });

    app.configure('prod',function(){
    	app.use(express.errorHandler());
    });

    //set up routes
    idata.routing(app,this.config.routes);

	app.log.info('reporting in!');

	app.config=this.config;
	app.dbserver=new idata.db(this.config.db);

	//open a database connection
	app.dbserver.connect(function(db){
		app.db=db;
	},
	function(error){
		throw error;
	});

	return this.app;
};
