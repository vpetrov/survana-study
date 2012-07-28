exports.title='iData Study';

exports.routes={
    'GET':{
    	'/': 			'index'
    },

    'POST':{
    }
};

exports.lib={
	'jquery':'lib/jquery/1.7.2'
};

/* default database config */
exports.db={
	name:'admin',
	host:'localhost',
	port:27017,
	//see https://github.com/christkv/node-mongodb-native/blob/master/docs/database.md
	server_options:{
		encoding:'utf8',
		auto_reconnect:true
	},
	db_options:{
		native_parser:false,    //couldn't get the BSON C++ parser to work on OS X
		strict:false            //false will prevent new collections from being autocreated
	}
};
