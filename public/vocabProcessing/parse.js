
var fs = require('fs');

var fileContent;
var text = '';

// fs.readFile('./raw.txt','utf8', function read(err, data) {
//     if (err) {
//         throw err;
//     }
//     fileContent = data;
//     var arr = fileContent.split('\n');
//
//     arr.forEach(function(element,idx){
//       var tempObj = {};
//       var tempArr = element.split(' ');
//       if (tempArr.length < 3) {
//         return;
//       }
//       tempArr[1] = '||';
//       tempArr = tempArr.join(" ").toLowerCase();
//       if (tempArr[tempArr.length-1] === "."){
//         tempArr = tempArr.slice(0,-1);
//       }
//       text += tempArr + "\n";
//       console.log(tempArr);
//       tempObj = {};
//     });
//
//     fs.writeFile('./output.txt',text , function(){
//       // console.log('done');
//     });
// });


fs.readFile('./300raw.txt','utf8', function read(err, data) {
    if (err) {
        throw err;
    }
    fileContent = data;
    var arr = fileContent.split('\n');

    arr.forEach(function(element,idx){
      element = element.toLowerCase();
      if (idx%2==0){
        text += element;
      } else {
        text += " || "+element+"\n";
      }
    });

    fs.writeFile('./300output.txt',text , function(){
      // console.log('done');
    });
});
