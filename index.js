const express = require('express');

const socket = require('socket.io');

const bodyParser = require('body-parser');

const routes = require('./routes/userAPI');

const mongoose = require('mongoose');

const assert = require('assert');

const cors = require('cors');

const passport = require('passport');

const users = require('./models/users');

//Set up express app
const app = express();

var MongoClient = require('mongodb').MongoClient;

//connect to Mongo DB

/*var promise = mongoose.connect('mongodb://localhost:27017/homelikechat', {
  useMongoClient: true,*/
  /* other options */
//});

/*var promise = mongoose.connect('mongodb://mohamedsujahath:suju%401984@homelike-shard-00-00-eireb.mongodb.net:27017,homelike-shard-00-01-eireb.mongodb.net:27017,homelike-shard-00-02-eireb.mongodb.net:27017/homelikechat?ssl=true&replicaSet=homelike-shard-0&authSource=admin', {
  useMongoClient: true,
  /* other options */
//});

var promise = mongoose.connect('mongodb://mohamedsujahath:suju1984@ds249415.mlab.com:49415/homelikechat', {
  useMongoClient: true,
  /* other options */
});

mongoose.Promise = require('bluebird');

//assert.equal(query.exec().constructor, require('bluebird'));

promise.then(function(db) {

});

//include Middleware

//include Body Parser
app.use(bodyParser.json());

app.use(cors());

// Initialize passport for use
  app.use(passport.initialize());

// Route Handler
app.use('/api', routes);

//include Middleware


//listen for requests

//var port = process.env.port || 5000;

app.set('port', (process.env.PORT || 5000));

/*var server = app.listen(port, '0.0.0.0' , function(){
    console.log('now listening for requests on ' + port);

});*/

//For avoidong Heroku $PORT error
var server = app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

/*var server = app.listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});*/

// set the view engine to ejs
//app.set('view engine', 'ejs');

// set the home page route
/*app.get('/', function(req, res) {

    // ejs render automatically looks in the views folder
    res.render('index');
});*/


if (process.env.NODE && ~process.env.NODE.indexOf("heroku")){
   console.log("I'm in Heroku!");
}

var io = socket(server);

var connectedUsers={};

/*io.use((socket, next) => {
    var emailID = socket.handshake.query.token;
    console.log('Connected User Email' + emailID);
    /*if (emailID !== null ) {
      return next();
    }*/
    //  return next(new Error('authentication error'));*/

  /*  users.update({'email':emailID}, {$set:{'connectedStatus':"connected", 'onlineStatus': "online", 'socketID' : socket.id}}, function(err, users) {

    });
});*/

// Set socket.io listeners.
  io.on('connection', (socket) => {
    console.log('a user connected' + socket.id);
  //  socket.to(socket.id).emit('socketID', socket.id);
    //console.log('Connected User Email ID: ' + socket.request..connectedUserEmail);

    var emailID = socket.handshake.query.token;
    console.log('Connected User Email' + emailID);
    var username = socket.handshake.query.name;
    console.log('Connected User Name' + username);

    users.update({'email':emailID}, {$set:{'connectedStatus':"connected", 'onlineStatus': "online", 'socketID' : socket.id}}, function(err, users) {
          socket.broadcast.emit('userLoggedIn', username);
      });
          //  connectedUsers[conversation.connectedUserEmail] =  socket.id;
          //  io.sockets.in(conversation).emit('refresh messages', conversation
          //console.log('Socket ID:' + connectedUsers[conversation.connectedUserEmail] + " - " + conversation.connectedUserEmail + socket.id);


    // On conversation entry, join broadcast channel
    socket.on('enter conversation', (conversation) => {
      socket.join(conversation);
      console.log('joined ' + conversation);
    });

    socket.on('leave conversation', (conversation) => {
      socket.leave(conversation);
       console.log('left ' + conversation);
    })

    socket.on('chatMessage', (conversation) => {
      console.log('Message received' + conversation.authorEmail + "-" + conversation.recipientEmail + "-" + conversation.message + " - " + conversation.conversationID);
      //io.sockets.in(conversation).emit('refresh messages', conversation);
      //console.log('Socket ID of receiver: ' + connectedUsers[conversation.recipientEmail]);

      users.findOne({'email':conversation.recipientEmail}, function(err, user) {
          console.log("Socket ID of the Receiver: " + user.socketID + " - " + conversation.recipientEmail);
          socket.to(user.socketID).emit('broadcastMessage', conversation);
      });

    });

    socket.on('userTyping', (typingConversation) => {
      console.log('Typing event received' + typingConversation.typingUserEmail + "-" + typingConversation.typingUserName + "-" + typingConversation.receiverEmail);
      //io.sockets.in(conversation).emit('refresh messages', conversation);
      //console.log('Socket ID of receiver: ' + connectedUsers[conversation.recipientEmail]);

      users.findOne({'email':typingConversation.receiverEmail}, function(err, user) {
          console.log("Socket ID of the Receiver: " + user.socketID + " - " + typingConversation.typingUserEmail);
          socket.to(user.socketID).emit('showUserTyping', typingConversation);
      });

    });



    socket.on('removeUserTyping', (typingConversation) => {
      console.log('Remove Typing event received' + typingConversation.typingUserEmail + "-" + typingConversation.typingUserName + "-" + typingConversation.receiverEmail);
      //io.sockets.in(conversation).emit('refresh messages', conversation);
      //console.log('Socket ID of receiver: ' + connectedUsers[conversation.recipientEmail]);

      users.findOne({'email':typingConversation.receiverEmail}, function(err, user) {
          console.log("Socket ID of the Receiver: " + user.socketID + " - " + typingConversation.typingUserEmail);
          socket.to(user.socketID).emit('userStoppedTyping', typingConversation);
      });

    });



    socket.on('newChatPosted', (newChatConversation) => {
      console.log('newChatPosted' + newChatConversation.UserEmail + "-" + newChatConversation.receiverEmail);
      //io.sockets.in(conversation).emit('refresh messages', conversation);
      //console.log('Socket ID of receiver: ' + connectedUsers[conversation.recipientEmail]);

      users.findOne({'email':newChatConversation.receiverEmail}, function(err, user) {
          console.log("Socket ID of the Receiver: " + user.socketID + " - " + newChatConversation.receiverEmail);
          socket.to(user.socketID).emit('newChatStarted', newChatConversation);
      });

    });

    socket.on('chatRemoved', (deleteChatConversation) => {
      console.log('chatRemoved' + deleteChatConversation.UserEmail + "-" + deleteChatConversation.receiverEmail);
      //io.sockets.in(conversation).emit('refresh messages', conversation);
      //console.log('Socket ID of receiver: ' + connectedUsers[conversation.recipientEmail]);

      users.findOne({'email':deleteChatConversation.receiverEmail}, function(err, user) {
          console.log("Socket ID of the Receiver: " + user.socketID + " - " + deleteChatConversation.receiverEmail);
          socket.to(user.socketID).emit('chatDeleted', deleteChatConversation);
      });

    });

    socket.on('userLogout', (logoutConversation) => {
      //console.log('Remove Typing event received' + typingConversation.typingUserEmail + "-" + typingConversation.typingUserName + "-" + typingConversation.receiverEmail);
      //io.sockets.in(conversation).emit('refresh messages', conversation);
      //console.log('Socket ID of receiver: ' + connectedUsers[conversation.recipientEmail]);
      users.update({'email': logoutConversation.userEmail}, {$set:{'connectedStatus':"disconnected", 'onlineStatus': "offline"}}, function(err, users) {
          socket.broadcast.emit('userLoggedOut', logoutConversation);
        });

    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
