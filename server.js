var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var scoresInRooms = [];
var arrOfAnswers = [];
var numOfAnswersSubmitted = [];


var questionList = [];

var fileContent;

fs.readFile('./public/vocabs.txt','utf8', function read(err, data) {
    if (err) {
        throw err;
    }
    fileContent = data;
    var arr = fileContent.split('\n');

    arr.forEach(function(element,idx){
      var tempObj = {};
      var tempArr = element.split('||');
      if (tempArr.length !== 2) {
        return;
      }
      tempObj['q'] = tempArr[0];
      tempObj['a'] = tempArr[1];
      // console.log(tempObj);
      questionList.push(tempObj);
      tempObj = {};

    });
});

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('create game', function(nickname, roomcode){
    // If that room already exists
    if (scoresInRooms[roomcode] !== undefined){
      // to-do
    }

    socket.join(roomcode);
    socket.roomcode = roomcode;
    socket.nickname = nickname;
    scoresInRooms[roomcode] = {};
    scoresInRooms[roomcode][nickname] = 0;
    console.log(scoresInRooms);
    numOfAnswersSubmitted[roomcode] = 0;
    io.to(roomcode).emit('update users', scoresInRooms[roomcode]);
  });
  socket.on('join game', function(nickname, roomcode){
    // Emit invalid if room code does not exist
    if (scoresInRooms[roomcode] === undefined){
      socket.emit('isValid', false, 'room');
      return false;
    }
    // Emit invalid if name already exists
    if (scoresInRooms[roomcode][nickname] !== undefined){
      socket.emit('isValid', false, 'name');
      return;
    }

    socket.join(roomcode);
    socket.roomcode = roomcode;
    socket.nickname = nickname;

    scoresInRooms[roomcode][nickname] = 0;
    socket.emit('isValid', true, 'name');
    io.to(roomcode).emit('update users', scoresInRooms[roomcode]);

  });

  socket.on('leave game', function(nickname, roomcode){
    delete scoresInRooms[roomcode][nickname];
    delete arrOfAnswers[roomcode][nickname];
    socket.leave(roomcode);
    io.to(socket.roomcode).emit('update users', scoresInRooms[socket.roomcode]);
    //
  });

  socket.on('chat message', function(msg){
    io.to(socket.roomcode).emit('chat message', socket.nickname, msg);
  });

  socket.on('generate question', function(){
    var quesNum = generateQuestionNum();
    var question = questionList[quesNum]['q'];
    // roomcode is key, array of answers is val
    arrOfAnswers[socket.roomcode] = {};
    arrOfAnswers[socket.roomcode]['___root'] = (questionList[quesNum]['a']);
    console.log(arrOfAnswers);
    io.to(socket.roomcode).emit('question generated', question);
  });

  socket.on('submit answer', function(answer){
    arrOfAnswers[socket.roomcode][this.nickname] = answer;
    console.log(arrOfAnswers);
    if (Object.keys(arrOfAnswers[socket.roomcode]).length === Object.keys(scoresInRooms[socket.roomcode]).length+1){
      // extract answers to make answer array
      var tempArr = [];
      for (var property in arrOfAnswers[socket.roomcode]) {
          if (arrOfAnswers[socket.roomcode].hasOwnProperty(property)) {
            tempArr.push(arrOfAnswers[socket.roomcode][property]);
          }
      }
      var shuffledAnswers = shuffleArray(tempArr);
      io.to(socket.roomcode).emit('answers collected', shuffledAnswers);
    }
  });
  socket.on('pick answer', function(finalAns){
    numOfAnswersSubmitted[socket.roomcode] += 1;
    // picked the right answer
    if (finalAns === arrOfAnswers[socket.roomcode]['___root']){
      scoresInRooms[socket.roomcode][socket.nickname] += 2;
      socket.emit('fooled by', '___root');
    }
    // picked their own answer
    else if (finalAns === arrOfAnswers[socket.roomcode][socket.nickname]){
      scoresInRooms[socket.roomcode][socket.nickname] -= 1;
      socket.emit('fooled by', undefined);
    }
    else {
      for (var user in arrOfAnswers[socket.roomcode]) {
          if (arrOfAnswers[socket.roomcode].hasOwnProperty(user)) {
            if (finalAns === arrOfAnswers[socket.roomcode][user]){
              socket.emit('fooled by', user);
              scoresInRooms[socket.roomcode][user] += 1;
              break;
            }
          }
      }
    }
    if (numOfAnswersSubmitted[socket.roomcode] === Object.keys(scoresInRooms[socket.roomcode]).length){
      // reset num of submitted answers
      numOfAnswersSubmitted[socket.roomcode] = 0;
      io.to(socket.roomcode).emit('update users', scoresInRooms[socket.roomcode]);
      io.to(socket.roomcode).emit('next question', scoresInRooms[socket.roomcode]);
    }
  });

  socket.on('disconnect', function(){
    if (socket.roomcode === undefined || socket.nickname === undefined ){
      return;
    }
    delete scoresInRooms[socket.roomcode][socket.nickname];
    io.to(socket.roomcode).emit('update users', scoresInRooms[socket.roomcode]);
  });
});

http.listen(process.env.PORT || 5000, function(){
  console.log('App started');
});

function generateQuestionNum() {
    var min = 0;
    var max = questionList.length-1;
    var val = Math.floor(Math.random() * (max - min + 1)) + min;
    return val;
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
