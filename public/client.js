var socket = io();
var roomcode;
var nickname;
var gameStarted = false;
var fooledBy;

$('#create-game').click(function(){
  nickname = $('#username').val();
  roomcode =  generateCode().toLowerCase();
  if (!isNameValid(nickname)){
    return false;
  }
  socket.emit('create game', nickname, roomcode);
  enterGameMode();
  return false;
})

$('#chat-input').submit(function(){
  socket.emit('chat message', $('#msg').val());
  $('#msg').val('');
  return false;
})
socket.on('chat message', function(chatSender, msg){
    $('#messages').append($('<li>').text(chatSender+' : '+msg));
    $('#messages-div').scrollTop($('#messages').height());
    // $('#messages').animate({scrollTop: ''+$('#messages li').height()});
    console.log($('#messages li').height());
  });


function isNameValid(nickname){
  if (nickname === ''){
    $('#error-msg').text('Please enter a nickname');
    return false;
  } else if (nickname === '___root') { // reserved name
    $('#error-msg').text('Sorry, this name is invalid');
    return false;
  }
  return true;
}

$('#join-game').click(function(){
  nickname = $('#username').val();
  if (!isNameValid(nickname)){
    return false;
  }
  $('#error-msg').text('');
  $('#join-game-div').show();
  return false;
})

$('#join-game-ok').click(function(){
  nickname = $('#username').val();
  roomcode = $('#code').val().toLowerCase();
  if (roomcode.length !== 5){
    $('#error-msg').text('Invalid room code');
    return false;
  }
  socket.emit('join game', nickname, roomcode);
  console.log('here');
  return false;
});

socket.on('isValid', function(isTrue, type){
  if (isTrue){
    $('#error-div').hide();
    enterGameMode();
  } else {
    if (type === 'name'){
      $('#error-msg').text('The name \''+ nickname+'\' is already taken in this room. Please select a new name.');
    } else if (type === 'room') {
      $('#error-msg').text('Invalid room code');
    }
  }
});

function enterGameMode(){
  $('#username-div').hide();
  $('#content-div').show();
  $('#question-div').hide();
  $('#mycode').text(roomcode);
  $('#passcode-div').show();
  $('#my-name').text('Name: '+nickname);
}

$('#play').click(function(){
  socket.emit('generate question');
});


$('#submit').click(function(){
  var myAnswer = $('#my-answer').val().toLowerCase().trim();
  // if (myAnswer.substr(myAnswer.length-1) === '.'){
  //   console.log(myAnswer.splice(myAnswer.length-1,1));
  // }
  while (myAnswer[myAnswer.length-1] === "."){
    myAnswer = myAnswer.slice(0,-1);
  }
  $('#my-answer').val('');
  socket.emit('submit answer', myAnswer);
  showStatus();
  return false;
});

socket.on('question generated', function(question){
  gameStarted = true;
  showQuestion();
  // remove if not playing vocabs
  question = 'What is the definition of: '+question;
  $('#question-text').text(question);
});

socket.on('next question', function(question){
  showPlay();
  $('#all-answers').text('');
});

socket.on('answers collected', function(answerArr){

  answerArr.forEach(function(answer){
    $('#all-answers').append('<li class=\'my-button my-button-answers\'>'+ answer + '</li>')
  });
  $('#all-answers li').click(function(){
    var myFinalAns = $(this).text();
    $('#all-answers').text('Waiting for other players...');
    socket.emit('pick answer', myFinalAns);
  });
  showAnswers();

});

socket.on('update users', function(scoreByUser){
  var list = '';
  var score;
  var sortedKeys = Object.keys(scoreByUser).sort(function(a,b){return list[a]-list[b]});
  console.log(sortedKeys);
  for (var user in scoreByUser) {
    if (scoreByUser.hasOwnProperty(user)) {
        score = scoreByUser[user];
        list += user + ' : '+ score + '</br>';
    }
  }

  // var sortedScores = [];
  // for (var user in scoreByUser){
  //     if (scoreByUser.hasOwnProperty(user)) {
  //         sortedScores.push([user, scoreByUser[user]]);
  //     }
  // }
  // sortedScores.sort(function(a, b) {
  //         return a[1] - b[1]
  //     }
  //   )
  // console.log(sortedScores);
  $('#player-list').html(list);
});

socket.on('fooled by',function(user){
  fooledBy = user;
})


function generateCode(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}



function showPlay(){
  if (gameStarted){
    $('#play').text('Next Question');
    $('#fooled-div').show();
    if (fooledBy === '___root'){
      $('#fooled-by').text('You are correct!');
    } else if (fooledBy === null){
      $('#fooled-by').text('You fooled yourself: -1');
    } else {
      $('#fooled-by').text('Fooled by: '+fooledBy);
    }
  }
  $('#play').show();
  $('#question-div').hide();
}

function showQuestion(){
  $('#play').hide();
  $('#fooled-div').hide();
  $('#question-div').show();
  $('#question-elements').show();
}

function showStatus(){
  $('#question-elements').hide();
  $('#status-div').show();
}

function showAnswers(){
  $('#status-div').hide();
  $('#question-elements').hide();
  $('#all-answers-div').show();
}
