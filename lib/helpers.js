 /*
  * Helpers
  *
  */

  // Dependecies
  var crypto = require('crypto');
  var config = require('../config');

  // Define a contianer for all the helpers
  var helpers = {};

  // Create a SHA256 hash
  helpers.hash = function(str) {
      // validate the string that is comming in
      if(typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
      } else {
          return false;
      }
  }

  // take in an arbitary string and return JSON or false if isn t valide JSON
  helpers.parseJsonToObject = function(str) {
    try {
        var obj = JSON.parse(str);
        return obj; // if the conversion works well, we ll retrun the JSON obj
    } catch(e) {
        return {}; // else, if catch an err over conversion, we ll return an empty string
    }
  }

  // Create a string of random alpha-numerics of a given lenght
  helpers.createRandomString = function(strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength) {
      // Define all the possible caracters taht could go to a strings
      var possibleCaracters = 'abcdefghijklmnopqrstuvwxyz0123456789';

      // Start the final string
      var str = '';
      for(i = 0; i < strLength; i += 1) {
        // get a random character
        var randomCharacter = possibleCaracters.charAt(Math.floor(Math.random() * possibleCaracters.length));
        // append it to the new string
        str += randomCharacter;
      }

      return str;
    } else {
      return false;
    }
  }

  // Export the container
  module.exports = helpers;