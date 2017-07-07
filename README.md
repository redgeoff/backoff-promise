# backoff-promise

Seed your JS project


# Example 1

    var i = 0,
      Backoff = require('backoff-promise'),
      backoff = new Backoff();

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


# Example 2: Different types of errors

    var i = 0,
      Backoff = require('backoff-promise'),
      backoff = new Backoff();

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
      var self = this;
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
      // err.message = 'transient-error'
    });
