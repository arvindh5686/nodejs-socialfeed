let isLoggedIn = require('./middlewares/isLoggedIn')
let posts = require('../data/posts')
let Twitter = require('twitter')
let then = require('express-then')

let networks = {
  twitter: {
    network: {
      icon: 'twitter',
      name: 'twitter',
      class: 'btn-primary'
    }
  }
}

module.exports = (app) => {
  let passport = app.passport
  let twitterConfig = app.config.auth.twitter;

  app.get('/', (req, res) => {
    res.render('index.ejs', {message: req.flash('error')})
  })

  app.get('/login', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

  app.get('/signup', (req, res) => {
      res.render('signup.ejs', {message: req.flash('error') })
  })

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true
  }))
  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true
  }))

  app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile.ejs', {
      user: req.user,
      message: req.flash('error')
    })
  })

  app.get('/compose', isLoggedIn, (req, res) => {
    res.render('compose.ejs')
  })

  app.post('/compose', isLoggedIn, then(async (req, res) => {
    let status = req.body.reply;
    if(!status.length) {
      return req.flash('error', 'Status cannot be empty')
    }

    if(!status.length || status.length > 140) {
      return req.flash('error', 'Status is over 140 characters')
    }

    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: twitterConfig.accessTokenSecret
    });

    await twitterClient.promise.post('/statuses/update', {status});
    res.redirect('/timeline');
  }))

  app.post('/like/:id', isLoggedIn, then(async (req, res) => {
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: twitterConfig.accessTokenSecret
    });

    let id = req.params.id;
    await twitterClient.promise.post('/favorites/create', {id});
    res.end();
  }))

  app.post('/unlike/:id', isLoggedIn, then(async (req, res) => {
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: twitterConfig.accessTokenSecret
    });

    let id = req.params.id;
    await twitterClient.promise.post('/favorites/destroy', {id});
    res.end();
  }))

  app.get('/reply/:id', isLoggedIn, then(async (req, res) => {
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: twitterConfig.accessTokenSecret
    });
    let tweet = await twitterClient.promise.get('/statuses/show/' + req.params.id);
    tweet = tweet[0];
    let post = {
      id: tweet.id_str,
      image: tweet.user.profile_image_url,
      text: tweet.text,
      name: tweet.user.name,
        //  username: '@'.tweet.user.screen_name,
      liked: tweet.favorited,
      //network: networks.twitter
    }
    res.render('reply.ejs', {post})
  }))

  app.post('/reply/:id', isLoggedIn, then(async (req, res) => {
    let status = req.body.reply;

    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: twitterConfig.accessTokenSecret
    });

    let id = req.params.id;
    let tweet = await twitterClient.promise.get('/statuses/show/' + id);
    
    tweet = tweet[0];
    
    await twitterClient.promise.post('/statuses/update', {
      in_reply_to_status_id: id,
      status: '@' + tweet.user.screen_name + ' ' + status
    });
    res.redirect('/timeline')
  }))

  app.get('/share/:id', isLoggedIn, then(async (req, res) => {
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: twitterConfig.accessTokenSecret
    });
    let tweet = await twitterClient.promise.get('/statuses/show/' + req.params.id);
    tweet = tweet[0];
    let post = {
      id: tweet.id_str,
      image: tweet.user.profile_image_url,
      text: tweet.text,
      name: tweet.user.name,
        //  username: '@'.tweet.user.screen_name,
      liked: tweet.favorited,
      //network: networks.twitter
    }
    res.render('share.ejs', {post})
  }))

  app.post('/share/:id', isLoggedIn, then(async (req, res) => {
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: twitterConfig.accessTokenSecret
    });

    let id = req.params.id;

    let tweet = await twitterClient.promise.post('/statuses/retweet/' + id);
    res.redirect('/timeline')
  }))

  app.get('/timeline', isLoggedIn, then(async (req, res) => {
    try{
      let twitterClient = new Twitter({
        consumer_key: twitterConfig.consumerKey,
        consumer_secret: twitterConfig.consumerSecret,
        access_token_key: req.user.twitter.token,
        access_token_secret: twitterConfig.accessTokenSecret
      });

      let [tweets] = await twitterClient.promise.get('/statuses/home_timeline');
      
      tweets = tweets.map(tweet => {
        return {
          id: tweet.id_str,
          image: tweet.user.profile_image_url,
          text: tweet.text,
          name: tweet.user.name,
        //  username: '@'.tweet.user.screen_name,
          liked: tweet.favorited,
          network: networks.twitter
        }
      })

      res.render('timeline.ejs', {
        posts: tweets
      })
    } catch(e) {
      console.log(e);
    }
    
  }))

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  // Scope specifies the desired data fields from the user account
let scope = 'email'

// Authentication route & Callback URL
app.get('/auth/facebook', passport.authenticate('facebook', {scope}))
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
}))

// Authorization route & Callback URL
app.get('/connect/facebook', passport.authorize('facebook', {scope}))
app.get('/connect/facebook/callback', passport.authorize('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
}))

// Authentication route & Callback URL
app.get('/auth/twitter', passport.authenticate('twitter', {scope}))
app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
}))

// Authorization route & Callback URL
app.get('/connect/twitter', passport.authorize('twitter', {scope}))
app.get('/connect/twitter/callback', passport.authorize('twitter', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
}))
}
