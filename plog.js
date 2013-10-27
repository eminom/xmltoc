
var fs = require('fs');

module.exports.logger = function(_log,file_name){
	var ws;
	if(file_name){
		ws = fs.createWriteStream(file_name);
	}

	var writer = function(){
		if(_log && ! ws){
			console.log.apply(null,Array.prototype.slice.call(arguments,0));
		}

		if( ws ){
			var bf = '';
			var args = Array.prototype.slice.call(arguments,0);
			for(var i=0,l=args.length;i<l;++i){
				bf += args[i].toString();
			}
			ws.write(bf);
			ws.write('\n');
		}
	};

	writer.close = function(){
		if(ws){
			ws.close();
		}
	};

	writer.comment = function(){
		if(ws){
			var d = new Date().toLocaleString();
			ws.write('// This file is generated automatically\n');
			ws.write('// Do NOT modify it \n');
			//ws.write('// Generated @');
			//ws.write(d + '\n');
		}
	};


	return writer;
};
