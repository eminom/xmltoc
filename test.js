
var fs = require('fs');
var xml = require('libxmljs');

var test_o = [
  'types.xml',
  'character.xml',
  'chapter.xml',
  'stage.xml',
  'skill.xml',
  'equipment.xml'
];

for(var i=0,l=test_o.length;i<l;++i){
  var buff = fs.readFileSync(test_o[i]);
  var xo = xml.parseXml(buff.toString());
  console.log('File ', test_o[i], ' passed.');
}
