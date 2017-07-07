'use strict';

var sporks = require('sporks');

// Simple way to implement an exponential backoff with promises
var Backoff = function (startingRetryAfterMSecs, maxRetryAfterMSecs, backoffFactor) {
  if (typeof startingRetryAfterMSecs !== 'undefined') {
    this.startingRetryAfterMSecs = startingRetryAfterMSecs;
  }

  if (typeof maxRetryAfterMSecs !== 'undefined') {
    this.maxRetryAfterMSecs = maxRetryAfterMSecs;
  }

  if (typeof backoffFactor !== 'undefined') {
    this.backoffFactor = backoffFactor;
  }

  this._init();
};

// Defaults
Backoff.prototype.startingRetryAfterMSecs = 1000;
Backoff.prototype.maxRetryAfterMSecs = 300000; // 5 mins
Backoff.prototype.backoffFactor = 1.1;

Backoff.prototype._init = function () {
  this._retryAfterMSecs = 0;
};

Backoff.prototype._nextRetryAfterMSecs = function () {
  if (this._retryAfterMSecs === 0) {
    return this.startingRetryAfterMSecs;
  } else {
    // Exponential backoff
    return Math.min(this.maxRetryAfterMSecs,
      Math.floor(this._retryAfterMSecs * this.backoffFactor));
  }
};

Backoff.prototype.failure = function () {
  // The attempt failed. Modify _retryAfterMSecs.
  this._retryAfterMSecs = this._nextRetryAfterMSecs();
};

Backoff.prototype.attempt = function (promiseFactory) {
  var self = this;

  return sporks.timeout(self._retryAfterMSecs).then(function () {
    return promiseFactory();
    // }).then(function (arg) {
    //   // The attempt was successful so reinitialize for next attempt
    //   self._init();
    //   return arg;
  }).catch(function (err) {
    // The attempt failed. Modify _retryAfterMSecs and throw the error back to the caller so that
    // the caller can figure out what to do next.
    self.failure();
    throw err;
  });
};

Backoff.prototype.run = function (promiseFactory) {
  var self = this;
  return self.attempt(promiseFactory).catch(function (err) {
    return self.run(promiseFactory);
  });
};

module.exports = Backoff;
