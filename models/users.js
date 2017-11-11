const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bcrypt = require('bcrypt');


const userSchema = new Schema({
    username: String,
    password: String,
    email: String,
    avatarImg: String,
    connectedStatus: String,
    onlineStatus: String,
    socketID: String,
    lastLoggedIn: Date
});


// Saves the user's password hashed (plain text password storage is not good)
userSchema.pre('save', function (next) {
  const user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
     console.log(user.password);
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

// Create method to compare password input to password saved in database
userSchema.methods.comparePassword = function(pw, cb) {
  bcrypt.compare(pw, this.password, function(err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

const Users = mongoose.model('users', userSchema);


module.exports = Users;
