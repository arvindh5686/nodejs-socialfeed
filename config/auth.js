// config/auth.js
module.exports = {
  'development': {
    facebook: {
        consumerKey: '764312370371679',
        consumerSecret: '750736e7b547b6ceb01503807dd4606f',
        callbackUrl: 'http://socialauthenticator.com:8000/auth/facebook/callback'
    },
    twitter: {
        consumerKey: '0zQX8MEUs0CrzkdZBUIGuTugP',
        consumerSecret: 'huWrKToLT4ujNyxDJ4ZHGGgp4hSiuRe7YBXTLbJ2wG3kPT77Vi',
        callbackUrl: 'http://socialauthenticator.com:8000/auth/twitter/callback',
        //TODO: Remove this and read from req.user
        accessTokenSecret: 'OyRmFouoSYDl1AHanpubpUgrwBvv60s02U2vI4bedHv2e'
    },
    'google': {
      'consumerKey': '446585441765-unda5mjs6307q1pqobvhiqj87m9m2kh1.apps.googleusercontent.com',
      'consumerSecret': '...',
      'callbackUrl': 'http://social-authenticator.com:8000/auth/google/callback'
    }
  }
}