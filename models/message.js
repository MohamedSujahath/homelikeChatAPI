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
  timestamps: true // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
});



module.exports = mongoose.model('Message', MessageSchema);
