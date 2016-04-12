let passport = require('passport')
let wrap = require('nodeifyit')
let User = require('../models/user')
let LocalStrategy = require('passport-local').Strategy
let FacebookStrategy = require('passport-facebook').Strategy
let TwitterStrategy = require('passport-twitter').Strategy
let config = require('../../config/auth')
require('songbird')
    // Handlers
async function localAuthHandler(email, password) {
    console.log(User);
    let user = await User.promise.findOne({ 'local.email': email })
    if (!user || email !== user.local.email) {
        return [false, { message: 'Invalid username' }]
    }

    if (!await user.validatePassword(password)) {
        return [false, { message: 'Invalid password' }]
    }
    return user
}

async function localSignupHandler(email, password) {
    email = (email || '').toLowerCase()
        // Is the email taken?
    if (await User.promise.findOne({ email })) {
        return [false, { message: 'That email is already taken.' }]
    }

    // create the user
    let user = new User()
    user.local.email = email
        // Use a password hash instead of plain-text
    user.local.password = await user.generateHash(password)
    return await user.save()
}

// 3rd-party Auth Helper
function loadPassportStrategy(OauthStrategy, config, userField) {
    config.passReqToCallback = true
    passport.use(new OauthStrategy(config, wrap(authCB, { spread: true })))

    async function authCB(req, token, _ignored_, account) {
        let accountId = userField + '.id';

        let user;
        if (req.user) {
            user = await User.promise.findById(req.user.id)
        } else {
            user = await User.promise.findOne({ accountId: account.id });
        }

        if (!user) user = new User();
        
        user[userField].id = account.id;
        user[userField].token = token;
        user[userField].secret = _ignored_;
        user[userField].name = account.displayName;
        user[userField].username = account.username;

        return await user.save();
    }
}

function configure(CONFIG) {
    // Required for session support / persistent login sessions
    passport.serializeUser(wrap(async(user) => user._id))
    passport.deserializeUser(wrap(async(id) => {
        return await User.promise.findById(id)
    }))

    /**
     * Local Auth
     */
    let localLoginStrategy = new LocalStrategy({
        usernameField: 'email', // Use "email" instead of "username"
        failureFlash: true // Enable session-based error logging
    }, wrap(localAuthHandler, { spread: true }))

    let localSignupStrategy = new LocalStrategy({
        usernameField: 'email',
        failureFlash: true
    }, wrap(localSignupHandler, { spread: true }))

    passport.use('local-login', localLoginStrategy)
    passport.use('local-signup', localSignupStrategy)

    /**
     * 3rd-Party Auth
     */

    loadPassportStrategy(FacebookStrategy, {
        clientID: CONFIG.facebook.consumerKey,
        clientSecret: CONFIG.facebook.consumerSecret,
        callbackURL: CONFIG.facebook.callbackUrl
    }, 'facebook')

    loadPassportStrategy(TwitterStrategy, {
            consumerKey: CONFIG.twitter.consumerKey,
            consumerSecret: CONFIG.twitter.consumerSecret,
            callbackURL: CONFIG.twitter.callbackUrl
        }, 'twitter')
        // loadPassportStrategy(LinkedInStrategy, {...}, 'linkedin')
        // loadPassportStrategy(FacebookStrategy, {...}, 'facebook')
        // loadPassportStrategy(GoogleStrategy, {...}, 'google')
        // loadPassportStrategy(TwitterStrategy, {...}, 'twitter')

    return passport
}

module.exports = { passport, configure }
