
var fs = require('fs');
var xml = require('libxmljs');
var type_map = require('./tymap').loadMap('types.xml');
var logger = require('./plog').logger;
var XStr = require('./xstr');

function genStructName(name){
	return name.substr(0,1).toUpperCase() + name.substr(1).toLowerCase() + 'XmlStru';
}

function filterCVarName(name){
	var rv = name;
	switch(name){
	case 'class':
	case 'char':
	case 'int':
	case 'struct':
	case 'namespace':
	case 'typedef':
	case 'double':
		rv = rv + '1';
		break;
	}
	return rv;
}

function parseConsole(){
	var pat_i = /-i=([\/\w\.]+)/;
	var args = Array.prototype.slice.call(process.argv,0);
	var rv = {}
	for(var i in args){
		var t = args[i];
		var m = pat_i.exec(t);
		if(m){
			rv.i = m[1];
		}
	}
	if ( rv.i ) {
		var p = rv.i.lastIndexOf('.xml');
		if( p<0 || rv.i.length - p != 4){
			rv.i = rv.i + '.xml';
		}
	}
	if ( rv.i && ! rv.name ) {
		var s = rv.i;
		var p = s.lastIndexOf('/');
		if(p>=0){
			s = s.substr(p+1);
		}
		var p = s.indexOf('.');
		if ( p >= 0 ){
			rv.name = s.substr(0,p);	
		} else {
			rv.name = s;
		}
		rv.name = rv.name.replace(/\./g,'_');
	}
	return rv;
}


function genShortName(name){
	return name.substr(0,1).toUpperCase() + name.substr(1,3).toLowerCase();
}

function genBriefName(s){
	var rv = '';
	var pos = 0, npos = 0;
	npos = s.indexOf('::',pos);
	if (npos>=0){
		while(npos>=0){
			var seg = s.substr(pos,npos-pos);
			rv += genShortName(seg);
			pos = npos + 2;
			npos = s.indexOf('::',pos);
		}
		rv += genShortName(s.substr(pos));
	} else {
		rv = genShortName(s);
	}
	return rv;
	
}


function recordItemEntry(type, name, stru_name , unit_name, map_name, record_finished){

	var bs = new XStr();
	bs.incIdent();
	bs.write('{');
	bs.incIdent();	//
	bs.write(unit_name + ' p;');
	switch(type){
	case 'int':
		bs.write('p.type = 0;');
		bs.write('p.pi = &' + stru_name + '::' + filterCVarName(name) +';');
		break;
	case 'double':
		bs.write('p.type = 1;');
		bs.write('p.di = &' + stru_name + '::' + filterCVarName(name) +';');
		break;
	case 'std::string':
	case 'string':
		bs.write('p.type = 2;');
		bs.write('p.si = &' + stru_name + '::' + filterCVarName(name) +';');
		break;
	case 'long long':
		bs.write('p.type = 3;');
		bs.write('p.lli = &' + stru_name + '::' + filterCVarName(name) + ';');
		break;
	}
	bs.write( map_name + '.insert(std::make_pair("' + name  +'", p));');
	bs.decIdent();
	bs.write('}\n');

	//console.log(bs.toStr());	
	if(typeof(record_finished) === 'function'){
		record_finished(bs.toStr());
	}
}

function getChunk(params,out, cb){
	if( ! fs.existsSync(params.i))
		return '';

	var buf = fs.readFileSync(params.i);
	var xo = xml.parseXml(buf.toString());
	var kids = xo.childNodes();

	var kid;
	for(var i in kids){
		if( kids[i].name() != 'text' ){
			kid = kids[i];
			break;
		}
	}

	if(!kid){
		return '';
	}

	var struct_name = genStructName(kid.name());
	if( ! Array.isArray(out.types)) {
		out.types = [];
	}

	out.cpp = out.cpp || '';

	out.types.push(struct_name);
	var upper  = 'struct ' + struct_name + ' {\n';
	var chunk = sampleChunk(kid,1,struct_name);
	var res = upper + chunk + '\n};\n';
	return res; // end of all

	function sampleChunk(node, level, now_name){
		level = level || 0;
		var o = '';

		var attrs = node.attrs();
		for(var i in attrs){
			var attr = attrs[i];
			var field_name = attr.name();
			if( field_name ){
				var type = type_map[field_name];
				type = type || 'int';   //TODO: Default type would be int
				var line = makeTabs(level) + type + ' ' + filterCVarName(field_name) + ';\n';
				o += line;

				if ( typeof cb === 'function' ) {
					var u = genUnitNameFromStruName(now_name);
					var m = genMapVarNameFromStruName(now_name);
					cb(type, field_name, now_name, u, m, function(data){
						out.cpp += data;
					});
				}
			}
		}
		
		var kids = node.childNodes();
		var kids_map = {};
		for(var i in kids){
			if(kids[i].name() != 'text'){
				var var_name = kids[i].name();
				if(!(var_name in kids_map)){
					kids_map[var_name] = 1;
				} else {
					kids_map[var_name] += 1;
				}
			}
		}

		for(var field_name in kids_map){
			var count = kids_map[field_name];
			if(count<=1){
				continue;
			}
			var ng = function(v){return '' + v + '_count';};
			var line = makeTabs(level) + 'int' + ' ' + ng(field_name) + ';\n';
			o += line;
		}

		for(var i in kids){
			if(kids[i].name() != 'text'){
				var inner = '';
				inner += '\n';
				var var_name = kids[i].name();

				if( !(var_name in kids_map) ){
					// Already processed. 
					continue;
				}

				var name = genStructName(var_name);
				var full_name = (now_name ? now_name + '::' : '' ) + name;
				out.types.push(full_name);
				inner += makeTabs(level) + 'struct ' + name + ' {\n';
				inner += sampleChunk(kids[i], level + 1, full_name );

				var element_counts = kids_map[var_name];
				// the element_counts depends. sometimes it's not big enough(not the MAX case)
				if( var_name == 'npc'){
					element_counts = 6;
				}

				var arr_sfx = '';
				if (element_counts > 1){
					arr_sfx = '[' + element_counts + ']';
				} 

				inner += makeTabs(level) + '} ' + var_name.toLowerCase() + arr_sfx + ';\n'; 
				o += inner;

				delete kids_map[var_name];	// Marked as processed. 
			}
		}

		return o;	
	}
}

function makeTabs(l){
	var v = '';
	for(var i=0;i<l;++i){
		v += '  ';
	}
	return v;
}


function getBeginTags(key){
	var macro_name = '__' + key.toUpperCase() + 'XML_DEF_H__';
	return '#ifndef ' + macro_name + '\n' + 
		'#define ' + macro_name + '\n' + 
		'\n#include <string>' +
		'\n#include <map>\n';
}

function getEndTags(){
	return "\n#endif";
}

function genMapVarNameFromStruName(stru_name){
	var d = genBriefName(stru_name).toLowerCase();
	return '_' + d + '_dc_';
}

function genUnitNameFromStruName(stru_name){
	return genBriefName(stru_name) + 'Unit';
}

function genUnitMapNameFromStruName(stru_name){
	return genUnitNameFromStruName(stru_name) + 'Map';
}

function genIntPtrNameFromStruName(stru_name){
	return genBriefName(stru_name) + 'IntPtr';
}

function genDoublePtrNameFromStruName(stru_name){
	return genBriefName(stru_name) + 'DoublePtr';
}

function genStrPtrNameFromStruName(stru_name){
	return genBriefName(stru_name) + 'StrPtr';
}

function genLongLongPtrNameFromStruName(stru_name){
	return genBriefName(stru_name) + 'LongLongPtr';
}

function genBasicTypes(ta, out){
	out = out || {};
	if( ! Array.isArray(out.types) ){
		out.types = [];
	}

	var rv = '';
	for(var i=0, l=ta.length; i < l ; ++i){
		var i_name = genIntPtrNameFromStruName(ta[i]);
		var d_name = genDoublePtrNameFromStruName(ta[i]);
		var s_name = genStrPtrNameFromStruName(ta[i]);
		var ll_name= genLongLongPtrNameFromStruName(ta[i]);

		var w = 'typedef int ' + ta[i] + '::*' + i_name;
		rv += w + ';\n';

		w = 'typedef double ' + ta[i] + '::*' + d_name;
		rv += w + ';\n';

		w = 'typedef std::string ' + ta[i] + '::*' + s_name;
		rv += w + ';\n';

		w = 'typedef long long ' + ta[i] + '::*' + ll_name;
		rv += w + ';\n';
		
		rv += '\n';

		var unit = genUnitNameFromStruName(ta[i]);
		w = 'struct ' + unit + ' {' + '\n';
		w += makeTabs(1) + 'int type;' + '\n';
		w += makeTabs(1) + 'union {' + '\n';
		w += makeTabs(2) + i_name + ' pi;' + '\n';
		w += makeTabs(2) + d_name + ' di;' + '\n';
		w += makeTabs(2) + s_name + ' si;' + '\n';
		w += makeTabs(2) + ll_name+ ' lli;'+ '\n';
		w += makeTabs(1) + '}' + ';\n';

		w += '};\n';

		rv += w + '\n';
		var map_name = genUnitMapNameFromStruName(ta[i]);

		w = 'typedef std::map<std::string,' + unit + '> ' + map_name + ';\n';
		rv += w + '\n\n';
	}
	return rv;
}

function genRandWord(l){
	l = l || 3;
	var w = '0123456789abcdefghijklmnopqrstuvwxyz';
	var v = '';
	for(var i=0;i<l;++i){
		v += w[Math.floor(Math.random()*w.length)%w.length];
	}
	return v;
}

function main(){
	var params = parseConsole();
	var rvs = {types:[],cpp:''};
	var o = getChunk(params, rvs, recordItemEntry);

	var header = params.name + '_def.h';
	var body = params.name + '_impl.cpp';

	var plog = logger(false,header);
	plog.comment();
	plog(getBeginTags(params.name || 'unknown' + genRandWord(4)));
	plog(o);
	plog(genBasicTypes(rvs.types));

	var types = rvs.types;
	for(var i=0,l=types.length;i<l;++i){
		plog( 'extern ' + genUnitMapNameFromStruName(types[i]) + ' ' + genMapVarNameFromStruName(types[i]) + ';');
	}

	plog('void ' + params.name + '_dc_init();');
	plog(getEndTags());

	//
	plog = logger(false, body);
	plog.comment();
	plog('////////');
	plog('#include "' + header + '"');
	plog();
	plog();

	for(var i=0,l=types.length;i<l;++i){
		plog( genUnitMapNameFromStruName(types[i]) + ' ' + genMapVarNameFromStruName(types[i]) + ';');
	}

	plog();
	plog('void ' + params.name + '_dc_init(){');

	plog(rvs.cpp);
	plog();
	plog('}');

	plog('//*/');
	plog('///');

	console.log(header);
	console.log(body);
}

//TODO
main();

