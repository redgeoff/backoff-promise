'use strict';

var Backoff = require('../scripts'),
  sporks = require('sporks'),
  Promise = require('sporks/scripts/promise');

describe('backoff', function () {

  var backoff = null,
    startingRetryAfterMSecs = 10,
    maxRetryAfterMSecs = 30,
    backoffFactor = 1.2;

  beforeEach(function () {
    // Override default attributes to allow for faster execution
    backoff = new Backoff(startingRetryAfterMSecs, maxRetryAfterMSecs, backoffFactor);
  });

  it('should handle success', function () {
    return backoff.attempt(function () {
      return Promise.resolve();
    });
  });

  it('should handle failure', function () {
    var err = new Error('some err');
    return sporks.shouldThrow(function () {
      return backoff.attempt(sporks.promiseErrorFactory(err));
    }, err);
  });

  it('should create backoff with default params', function () {
    // Override default attributes to allow for faster execution
    var backoff = new Backoff();
    backoff.backoffFactor.should.eql(1.1);
  });

  it('should example 1', function () {
    var i = 0;

    var myPromise = function () {
      return new Promise(function (resolve, reject) {
        if (i++ < 5) {
          reject(new Error('transient-error'));
        } else {
          resolve('foo');
        }
      });
    };

    return backoff.run(function () {
      return myPromise();
    });
  });

  it('should example 2', function () {
    var i = 0,
      hasPermanentError = false;

    var myPromise = function () {
      return new Promise(function (resolve, reject) {
        if (i++ < 3) {
          reject(new Error('transient-error'));
        } else {
          reject(new Error('permanent-error'));
        }
      });
    };

    var shouldRetry = function (err) {
      // Permanent error? If so, then stop retrying
      if (err.message === 'permanent-error') {
        throw err;
      }
    };

    return backoff.run(function () {
      return myPromise();
    }, shouldRetry).catch(function (err) {
      err.message.should.eql('permanent-error');
      hasPermanentError = true;
    }).then(function () {
      hasPermanentError.should.eql(true);
    });
  });

  it('should run and backoff', function () {
    var i = 0,
      retryAfterMSecs = startingRetryAfterMSecs,
      n = 0;

    return backoff.run(function () {
      if (i++ < 5) {
        if (i === 1) {
          backoff._retryAfterMSecs.should.eql(0);
        } else {
          backoff._retryAfterMSecs.should.eql(retryAfterMSecs);
          retryAfterMSecs *= backoffFactor;
          retryAfterMSecs = Math.min(Math.floor(retryAfterMSecs), maxRetryAfterMSecs);
        }

        n++;

        return sporks.promiseError(new Error());
      } else {
        return Promise.resolve();
      }
    }).then(function () {
      // Make sure that we aren't considering other errors
      n.should.eql(5);
    });
  });

  it('should attempt', function () {
    var i = 0,
      hasPermanentError = false;

    var myPromise = function () {
      return new Promise(function (resolve, reject) {
        if (i++ < 3) {
          reject(new Error('transient-error'));
        } else {
          reject(new Error('permanent-error'));
        }
      });
    };

    var run = function (promiseFactory) {
      return backoff.attempt(promiseFactory).catch(function (err) {
        // Run again?
        if (err.message === 'transient-error') {
          return run(promiseFactory);
        } else if (err.message === 'permanent-error') {
          // Permanent error, so stop
          throw err;
        }
      });
    };

    return run(function () {
      return myPromise();
    }).catch(function (err) {
      err.message.should.eql('permanent-error');
      hasPermanentError = true;
    }).then(function () {
      hasPermanentError.should.eql(true);
    });
  });

});
