
var xml = require('libxmljs');
var fs = require('fs');
var plog = require('./plog').logger(false);

var exp = module.exports;

var walkDocument = function(node,m){
	var kids = node.childNodes();
	for(var i in kids){
		var kid = kids[i];
		var attrs = kid.attrs();
		var type = 'int';
		for(var j in attrs){
			var t = attrs[j];
			if(t.name() =='type'){
				type = t.value();
				break;
			}
		}
		m[kid.name()] = type;
	}
};

exp.loadMap = function(args){
	if( ! Array.isArray(args) ){
		args = Array.prototype.slice.call(arguments,0);
	}

	var rv = {};

	for(var i in args){
		var file = args[i];
		if( ! fs.existsSync(file) ){
			continue;
		}

		plog('Loading from "' + file + '" ...');	
		var d = fs.readFileSync(file);
		var root = xml.parseXml(d.toString());
		walkDocument(root, rv);
	}
	return rv;
};


