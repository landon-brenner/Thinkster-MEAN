var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true},
  hash: String,
  salt: String
});

// Accept password, generate salt and password hash
UserSchema.methods.setPassword = function(password){
  console.log('creating password');
  this.salt = crypto.randomBytes(16).toString('hex');
  console.log(this.salt);

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

// Accept password, compare to hash, return a boolean
UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

/*
second argument of jwt.sign() is the secret used to sign tokens
use an environment variable for referencing secret,
keep it out of codebase.
*/

UserSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    _id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, process.env['THINKSTER_MEAN']);
};

mongoose.model('User', UserSchema);