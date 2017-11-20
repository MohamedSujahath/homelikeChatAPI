const express = require('express');

const router = express.Router();

const users = require('../models/users');

const Conversation = require('../models/conversation'),
      Message = require('../models/message');


// Import dependencies
var passport = require('passport');
//var express = require('express');
var config = require('../config/main');
var jwt = require('jsonwebtoken');

    // Bring in defined Passport Strategy
  require('../config/passport')(passport);

//get list of users

router.get('/getAllUsers', function(req, res){
    users.find({}, function(err, users) {
    var userMap = {};
    let userList = [];
    users.forEach(function(user) {
      //userMap[user._id] = user;
      userList.push(user);
    });



    return res.status(200).json({ users:userList });


    //res.send(userMap);
});
});

router.post('/registerUser', function(req, res){
    console.log(req.body.username);
    let avatarNumber = getRandomInt(1,7);
    req.body.avatarImg = "https://bootdey.com/img/Content/avatar/avatar" + avatarNumber + ".png";
    req.body.connectedStatus = "disconnected";
    req.body.onlineStatus = "offline";
    req.body.socketID = "";
    req.body.lastLoggedIn = "";

    /*$or : [
            { '_id': req.body.conversationId }, { 'participants': req.body.user._id }
          ]*/

    users.findOne({
      email: req.body.email
    }, function(err, user) {
      if (err) throw err;

      if (user) {
        res.send({ success: false, message: 'User already exists !!! Please enter a new email ID.' });
      }
      else {
        users.create(req.body).then(function(users){
              res.send({ success: true, message: 'User Created !!!' });
        });
      }
    }
  )


});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

router.post('/getUserDetails', function(req, res){
    users.find({'email':req.body.email}, function(err, users) {
    var userMap = {};

    users.forEach(function(user) {
      userMap["user"] = user;
    });

    res.send(userMap);
});
});

// Authenticate the user and get a JSON Web Token to include in the header of future requests.
  router.post('/authenticate',  function(req, res) {
    users.findOne({
      email: req.body.email
    }, function(err, user) {
      if (err) throw err;

      if (!user) {
        res.send({ success: false, message: 'Authentication failed. User not found.' });
      } else {
        // Check if password matches
        user.comparePassword(req.body.password, function(err, isMatch) {
          if (isMatch && !err) {
            updateUserCollection(req.body.email);
            // Create token if the password matched and no error was thrown
            //var token = jwt.sign(users, config.secret, { expiresIn: '1h' });
            var token = jwt.sign({exp: 10180 ,data: 'users'}, 'secret');
            res.json({ success: true, token: 'JWT ' + token });
          } else {
            res.send({ success: false, message: 'Authentication failed. Passwords did not match.' });
          }
        });
      }
    });
  });


  function updateUserCollection(email) {

    console.log("inside updateUserCollection" + email);
    var currentTimeStamp = getTimeStamp();

    console.log("currentTimeStamp : " + currentTimeStamp);
    users.update({'email':email}, {$set:{'connectedStatus':"connected", 'onlineStatus': "online", 'lastLoggedIn': currentTimeStamp}}, function(err, users) {

    });

  }

  function getTimeStamp() {
    var now = new Date();
    return ((now.getMonth() + 1) + '/' +
            (now.getDate()) + '/' +
             now.getFullYear() + " " +
             now.getHours() + ':' +
             ((now.getMinutes() < 10)
                 ? ("0" + now.getMinutes())
                 : (now.getMinutes())) + ':' +
             ((now.getSeconds() < 10)
                 ? ("0" + now.getSeconds())
                 : (now.getSeconds())));
  }

// passport.authenticate('jwt', { session: false })  - 2 nd argument

// get All Conversation for a User
router.get('/getAllConversationList', function(req, res, next) {
  // Only return one message from each conversation to display as snippet
    console.log("get All Conversations : " +  req.query.userid);
  Conversation.find({ participants: req.query.userid })
    .select('_id')
    .sort('-updatedAt')
    .exec(function(err, conversations) {
      if (err) {
        res.send({ error: err });
        return next(err);
      }
      if(conversations.length > 0){
            // Set up empty array to hold conversations + most recent message
            let fullConversations = [];
            conversations.forEach(function(conversation) {
              Message.find({ 'conversationId': conversation._id })
                .sort('-updatedAt')
                .limit(1)
                .populate('author')
                .populate('recipient')
                .exec(function(err, message) {
                  if (err) {
                    res.send({ error: err });
                    return next(err);
                  }
                  fullConversations.push(message);
                  if(fullConversations.length === conversations.length) {
                    return res.status(200).json({ conversations:fullConversations });
                  }

                });
            });
        }
        else {
          return res.status(200).json({ conversations:[] });
        }
  });
});

// Get All Messages in a single Conversation
router.get('/getAllMessagesinConversation', function(req, res, next) {
    console.log( req.query.conversationId);
  Message.find({ conversationId: req.query.conversationId })
    .select('createdAt updatedAt body author conversationId')
    .sort('createdAt')
    .populate('author')
    .populate('recipient')
    .exec(function(err, messages) {
      if (err) {
        res.send({ error: err });
        return next(err);
      }

      res.status(200).json({ messageList: messages });
    });
});


// start a new Conversation
router.post('/newConversation/:recipient', function(req, res, next) {

  if(!req.params.recipient) {
    res.status(422).send({ error: 'Please choose a valid recipient for your message.' });
    return next();
  }

  if(!req.body.composedMessage) {
    res.status(422).send({ error: 'Please enter a message.' });
    return next();
  }

  const conversation = new Conversation({
    participants: [req.body.user, req.params.recipient]
  });

  conversation.save(function(err, newConversation) {
    if (err) {
      res.send({ error: err });
      return next(err);
    }

    const message = new Message({
      conversationId: newConversation._id,
      body: req.body.composedMessage,
      author: req.body.user._id,
      recipient: req.params.recipient
    });

    message.save(function(err, newMessage) {
      if (err) {
        res.send({ error: err });
        return next(err);
      }

      res.status(200).json({ message: 'Conversation started!', conversationId: conversation._id });
      return next();
    });
  });
});


// Reply to a conversation
 router.post('/replyConversation', function(req, res, next) {
  const reply = new Message({
    conversationId: req.body.conversationId,
    body: req.body.composedMessage,
    author: req.body.user._id,
    recipient: req.body.recipient._id
  });

  reply.save(function(err, sentReply) {

    Conversation.findByIdAndUpdate(req.body.conversationId, {timestamps: ''}, function(err, sentReply)  {
        console.log("updated Conversation"); // here the timestamp is +5 seconds, as expected
      });
    if (err) {
      res.send({ error: err });
      return next(err);
    }

    res.status(200).json({ message: 'Reply successfully sent!', conversationId:req.body.conversationId });
    return(next);
  });
} );

//Delete a Conversation

router.post('/deleteConversation',  function(req, res, next) {
  Conversation.findOneAndRemove({
    $and : [
            { '_id': req.body.conversationId }, { 'participants': req.body.user._id }
           ]}, function(err) {
        if (err) {
          //res.send({ error: err });
          //return next(err);
          console.log(err);
        }

        //res.status(200).json({ message: 'Conversation removed!' });
        //return next();
  });

    Message.remove({'conversationId': req.body.conversationId }, function(err) {
            if (err) {
                console.log(err);
            } else {
                //res.status(200).json({ message: 'Messages removed!' });
            }
        }
    );
});

//update a Conversation

 router.put('/updateConversation',function(req, res, next) {
  Conversation.find({
    $and : [
            { '_id': req.body.messageId }, { 'author': req.body.user._id }
          ]}, function(err, message) {
        if (err) {
          res.send({ error: err});
          return next(err);
        }

        message.body = req.body.composedMessage;

        message.save(function (err, updatedMessage) {
          if (err) {
            res.send({ error: err });
            return next(err);
          }

          res.status(200).json({ message: 'Message updated!' });
          return next();
        });
  });
} );


module.exports = router;
