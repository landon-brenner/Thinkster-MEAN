var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

// Use environment variable for secret, keep it out of code base
var auth = jwt({secret: process.env['THINKSTER_MEAN'], userProperty: 'payload'});

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

// Preload post objects
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function(err, post) {
    if (err) {return next(err);}
    if (!post){return next(new Error('can\'t find post'));}

    req.post = post;
    return next();
  });
});

// Preload comment objects
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function(err, comment) {
    if(err){return next(err);}
    if(!comment){return next(new Error('can\'t find comment'));}

    req.comment = comment;
    return next();
  });
});

// Root route
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Get all post objects
router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){return next(err);}
    res.json(posts);
  });
});

// Get one post object by ID
router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if(err){return next(err);}
    res.json(post);
  });
});

// Create new post
router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;

  post.save(function(err, post) {
    if(err){return next(err);}
    res.json(post);
  });
});

// Create new comment
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;

  comment.save(function(err, comment) {
    if(err){return next(err);}

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){return next(err);}

      res.json(comment);
    });
  });
});

// Upvote a post
router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err){return next(err);}
    res.json(post);
  });
});

// Downvote a post
router.put('/posts/:post/downvote', auth, function(req, res, next) {
  req.post.downvote(function(err, post){
    if (err){return next(err);}
    res.json(post);
  });
});

// Upvote a comment
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(function(err, comment){
    if(err){return next(err);}
    res.json(comment);
  });
});

// Downvote a comment
router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next) {
  req.comment.downvote(function(err, comment){
    if(err){return next(err);}
    res.json(comment);
  });
});

// Create username and password
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
  // console.log('about to create user');
  var user = new User();
  // console.log('user object created');

  user.username = req.body.username;

  user.setPassword(req.body.password);
  // console.log(user);

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

// Login route authenticates the user and returns a token to the client
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

module.exports = router;
