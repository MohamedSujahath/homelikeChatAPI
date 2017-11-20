const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

const users = require('../models/users');

const MessageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  }
},
{
  timestamps: true 
});



module.exports = mongoose.model('Message', MessageSchema);
