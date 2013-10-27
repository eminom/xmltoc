

var XStrStream = function(){
	this.__buff = '';
	this.__ident = 0;
};

XStrStream.prototype.write = function(){
	this.__buff += this.makeTabs();
	var args = Array.prototype.slice.call(arguments, 0);
	for(var i=0, l=args.length;i<l;++i){
		this.__buff += args[i];
	}
	this.__buff += '\n';

};

XStrStream.prototype.toStr = function(){
	return this.__buff.toString();
};

XStrStream.prototype.setIdent = function(l){
	l = l || 0;
	this.__ident = l;
};

XStrStream.prototype.incIdent = function(){
	this.__ident++;
};

XStrStream.prototype.decIdent = function(){
	var l = this.__ident - 1;
	if(l>=0){
		this.__ident = l;
	}
};

XStrStream.prototype.makeTabs = function(){
	var t = '';
	for(var i=0;i<this.__ident;++i){
		t += '  ';
	}
	return t;
};


module.exports = XStrStream;


