const express = require('express');

const socket = require('socket.io');

const bodyParser = require('body-parser');

const routes = require('./routes/userAPI');

const mongoose = require('mongoose');

const assert = require('assert');

const query = require('query');

const cors = require('cors');

const passport = require('passport');

//Set up express app
const app = express();

var MongoClient = require('mongodb').MongoClient;

//connect to Mongo DB

/*var promise = mongoose.connect('mongodb://localhost:27017/homelikechat', {
  useMongoClient: true,*/
  /* other options */
//});

var promise = mongoose.connect('mongodb://mohamedsujahath:suju%401984@homelike-shard-00-00-eireb.mongodb.net:27017,homelike-shard-00-01-eireb.mongodb.net:27017,homelike-shard-00-02-eireb.mongodb.net:27017/homelikechat?ssl=true&replicaSet=homelike-shard-0&authSource=admin', {
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

var server = app.listen(process.env.port || 4000, '0.0.0.0' , function(){
    console.log('now listening for requests');

});


var io = socket(server);

var connectedUsers={};



// Set socket.io listeners.
  io.on('connection', (socket) => {
    console.log('a user connected' + socket.id);

    socket.on('userJoined', (conversation) => {
      console.log('userJoined' + conversation.connectedUserEmail);
      connectedUsers[conversation.connectedUserEmail] =  socket.id;
    //  io.sockets.in(conversation).emit('refresh messages', conversation
    console.log('Socket ID:' + conversation.connectedUserEmail + socket.id);
      });

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
      console.log('Message received' + conversation.recipientEmail, conversation.message);
      //io.sockets.in(conversation).emit('refresh messages', conversation);
      console.log('Socket ID of receiver: ' + connectedUsers[conversation.recipientEmail]);
      io.to(connectedUsers[conversation.recipientEmail]).emit('chatMessage', conversation.message);

      });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
