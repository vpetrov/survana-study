exports.title='Survana Study';

exports.routes={
    'GET':{
        '/': 			'index',
        '/(([\\w]+))':  'study',
        '/(([\\w]+))/(([\\w]+))':   {'study':'form'}
    },

    'POST':{
    }
};

exports.theme={
    global:'b',
    nav:'a',
    content:'c',
    input:'c',
    select:'c',
    radio:'c',
    check:'c',
    button:'a',
    active:'b',
    collapsible:'a',
    bubble:'c'
}

exports.adapters={
    'mobile':'adapters/jquery-mobile',
    'desktop':'adapters/bootstrap'
};

exports.lib={
	'jquery':'lib/jquery/1.7.2',
    'jquery-mobile':'lib/jquery/mobile/1.1.0',
    'jquery-plugins':'lib/jquery/plugins'
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
