# backoff-promise

[![Greenkeeper badge](https://badges.greenkeeper.io/redgeoff/backoff-promise.svg)](https://greenkeeper.io/) [![Circle CI](https://circleci.com/gh/redgeoff/backoff-promise.svg?style=svg&circle-token=fc3a5ff9f39a7bcfc2fde7002a602cfe7e37a6d6)](https://circleci.com/gh/redgeoff/backoff-promise)

Seed your JS project


## Example 1

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


## Example 2: Different types of errors

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

    var shouldRetry = function (err) {
      // Permanent error? If so, then stop retrying
      if (err.message === 'permanent-error') {
        throw err;
      }
    };

    return backoff.run(function () {
      return myPromise();
    }, shouldRetry).catch(function (err) {
      // err.message = 'transient-error'
    });
