 /*
  * Request handlers
  *
  */

 // Dependencies
 var _data = require('./data');
 var helpers = require('./helpers');
 var config = require('../config');

 //Define the handlers
 var handlers = {};

 // Not found handler
 handlers.notFound = function(data, callback) {
   callback(404);
 };

 // Ping Handler
 handlers.ping = function(data, callback) {
   callback(200);
 };
 // Users Handler
 handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    // test if the methon requested (in data.method) is acceptable method
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        // callback 405 - is the HTTP code for method not allow
        callback(405); 
    }
 };

 // Container for the user submethods
 handlers._users = {};

 // Users - POST method
 // Requiered data: firstName, lastName, phone, password, tosAgreement : bool
 handlers._users.post = function(data, callback) {
    // Check that all requiered fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false; // trim() eliminate the white spaces
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false; // trim() eliminate the white spaces
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false; // trim() eliminate the white spaces
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false; // trim() eliminate the white spaces
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' ? data.payload.tosAgreement : false; 

    console.log(firstName+" | "+lastName+" | "+phone+" | "+password+" | "+tosAgreement+" | ");
    if(firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesent alerady exist
        // toDo that we'll atempt to read form the user data
        // and if the user data come back with an error
        // then we know, he doesent exist, easy, pff.
        _data.read('users', phone, function(err, data) {
            if(err) { // we're good to go, there is no other user with this phone
                // we start the process of creating a new user
                // toDo that we need to hash the password
                var hashedPassword = helpers.hash(password); 
                if(hashedPassword) {
                    // create the user obj
                    var userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };

                    // store the user
                    _data.create('users', phone, userObject, function(err) {
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not create the user!'});
                        }
                    });
                } else {
                    callback(500, {'Error' : 'Could not hash the password!'});
                }

            } else { // welp, there exist another user with this phon :(
                callback(400, {'Error' : 'This user with this phone number already exist!'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing requiered field'});
    }
 };

 // Users - GET method
 // Requiered data : phone
 // Obtional : none
 // @toDo -  only let just an authenticated user acces theri obj. DOnt't let them acces anyoane else's
 handlers._users.get = function(data, callback) {
    // Check that the phone number provided is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && 
                data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if(phone) {
        // this will resolve the todo : get the token from the headers
        var tokenID = typeof(data.headers.token) == 'string' ?
                      data.headers.token : false;
        handlers._tokens.verifyToken(tokenID, phone, function(ok) {
            if(ok) {
                // Lookup the user
                _data.read('users', phone, function(err, data) {
                    if(!err && data) { // if the user is found and there is data
                        // remove the hashed password from the usr obj, before returning it to the requester
                        delete data.hashedPassword; // just delete the element hashedPassword form the data obj, we don t want return the hashed passwd to the user
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {'Error' : 'Missing token, or the token isn t valide anymore'});
            }
        });
    } else {
        callback(400, {'Error' : 'The phone nr. provided is invalid!'});
    }
 }

 // Users - PUT method
 // Requiered data : phone
 // Optional data : firstName,lastName, password (at leat one must be specified)
 // @TODO only let an authenticated user to update their own obj. Don't let update anyone elses
 handlers._users.put = function(data, callback) {
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false; // trim() eliminate the white spaces
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ?
                data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ?
                data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
                data.payload.password.trim() : false;
    console.log(data.payload.firstName);
    if(phone) {

        // get the token for the curent user form the header
        var tokenID = typeof(data.headers.token) == 'string' ?
                      data.headers.token : false;
        handlers._tokens.verifyToken(tokenID, phone, function(ok) {
            if(ok) {
                if(firstName || lastName || password) {
                    _data.read('users', phone, function(err, data) {
                        if(!err && data) {
                            if(firstName) {
                                data.firstName = firstName;
                            }

                            if(lastName) {
                                data.lastName = lastName;
                            }

                            if(password) {
                                data.hashedPassword = helpers.hash(password); 
                            }
                            _data.update('users', phone, data, function(err, data) {
                                if(!err) {
                                    callback(200, {'Success' : 'Update complet'});
                                } else {
                                    callback(500, {'Error' : 'Could not update!'});
                                }
                            });
                        } else {
                            callback(404);
                        }
                    });
                } else {
                    callback(400, {'Error' : 'Missing fields to update'});
                }
            } else {
                callback(403, {'Error' : 'no token!'});
            }
        });
    } else {
        callback(400, {'Error' : 'There is no field complete u dumb ass!'});
    }
 }

 // Users - DELETE method
 // Requiered field : phone
 // @TODO let an authentificated user to delete just their own obj.
 // @TODO delete all the data files associated with this user
 handlers._users.delete = function(data, callback) {
     var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ?
                 data.queryStringObject.phone.trim() : false;
    if(phone) {
        // get the perosnal token
        var tokenID = typeof(data.headers.token) == 'string' ? 
                    data.headers.token : false;
        handlers._tokens.verifyToken(tokenID, phone, function(ok){ 
            if(ok) {
                _data.read('users', phone, function(err, data) {
                    if(!err && data) {
                        _data.delete('users', phone, function(err) {
                            if(!err) {
                                callback(200, {'Success' : 'Delete complet'});
                            } else {
                                console.log(err);
                                callback(500, {'Error' : 'Can t delete this user obj!'});
                            }
                        }); 
                    } else {
                        callback(400, {'Error' : 'There is no user with this phone'});
                    }
                });
            } else {
                callback(403, {'Error' : 'there is no token fam@'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing requiered fields'});
    }
 }

 // Tokens 
 handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
 };

 // Container for all the tokens methods
 handlers._tokens = {};

 // Token - POST
 // Requiered data: phone, password
 // Optional data : none
 handlers._tokens.post = function(data, callback) {
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ?
                data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
                data.payload.password.trim() : false;
    if(phone && password) {
        // Lookup the user who matches that phone number
        _data.read('users', phone, function(err, data) {
            if(!err && data) {
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == data.hashedPassword) {
                    // if valid, create a random token name, set expiration date 1 hour in the future
                    var tokenID = helpers.createRandomString(20);
                    var expires = Date.now() + 1000*60*60;
                    var tokenObject = {
                        'phone' : phone,
                        'id' : tokenID,
                        'expires' : expires
                    };
                    _data.create('tokens', tokenID, tokenObject, function(err) {
                        if(!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error' : 'Could not create the new token'});
                        }
                    });
                } else {
                    callback(400, {'Error' : 'Can t create the token, if u dont provide the corect data!(password didnt match)'});
                }
            } else {
                callback(400, {'Error' : 'Could not fnd the specified user'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing requiered fields!'});
    }
 };

 // Token - GET
 // Requiered data : id
 // optional data: none
 handlers._tokens.get = function(data, callback) {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ?
             data.queryStringObject.id.trim() : false;
    console.log(data.queryStringObject.id);
    if(id) {
        _data.read('tokens', id, function(err, data) {
            if(!err && data) {
                callback(200, data);
            } else {
                callback(500, {'Error' : 'There is no token with this id'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing requiered fields'});
    }
 };

// Token - PUT
// Requiered data : id, extend (boolean) - tell if extends the expiration date
// Optional data : none
handlers._tokens.put = function(data, callback) {
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ?
             data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ?
                 true : false;
    if(id && extend) {
        _data.read('tokens', id, function(err, data) {
            if(!err && data) {
                if(data.expires > Date.now()) {
                    // Extend
                    data.expires = Date.now() + 1000*60*60;

                    // Update
                    _data.update('tokens', id, data, function(err) {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, 'Cant update!');
                        }
                    });
                } else {
                    callback(500, {'Error' : 'Can t extend, the token have already expired'})
                }
            } else {
                callback(400, {'Error' : 'There is no such token'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing requiered fields!'});
    }
};

// Token - DELETE
// Requiered data : id
// Optional data : none
handlers._tokens.delete = function(data, callback) {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ?
             data.queryStringObject.id.trim() : false;
    if(id) {
        _data.read('tokens', id, function(err, data) {
            if(!err && data) {
                _data.delete('tokens', id, function(err) {
                    if(!err) {
                        callback(200);
                    } else {
                        console.log(err);
                        callback(500, {'Error' : 'Cant delete'});
                    }
                });
            } else {
                callback(405, {'Error' : 'There is no token with this id'});
            }
        });
    } else {
        callback(405, {'Error' : 'Missing requiered param!'});
    }
};

// verify if a given token id is curently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
    // lookup the token
    _data.read('tokens', id, function(err, tokenData) {
        if(!err && tokenData) {
            if(phone == tokenData.phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// Checks
handlers.checks = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the checks method
handlers._checks = {};

// POST
// Requiered data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = function(data, callback) {
    // validate inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ?
                   data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ?
              data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ?
                   data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ?
              data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 ===0 &&  data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ?
              data.payload.timeoutSeconds  : false;
    console.log(data.payload.protocol+url+method+successCodes+timeoutSeconds);
    if(protocol && url && method && successCodes && timeoutSeconds) {
        // get the token form the headers
        var tokenID = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // lookup the user by reading that token
        _data.read('tokens', tokenID, function(err, data) {
            var userPhone = data.phone;

            // lookup the user by readin the token
            _data.read('users', userPhone, function(err, data) {
                if(!err && data) {
                    // if the user data is good, we need to see what checks he laready have
                    var userChecks = typeof(data.checks) == 'object' && data.checks instanceof Array ?
                                     data.checks : [];
                    // verify if the nr of check of user < max nr of checks
                    if(userChecks.length < config.maxChecks) {
                        // create a random ID for the check
                        var checkID = helpers.createRandomString(20);

                        // create the check object and include the user phone
                        var checkObject = {
                            'id' : checkID,
                            'userPhone' : userPhone,
                            'protocol' : protocol,
                            'url' : url,
                            'method' : method,
                            'successCodes' : successCodes,
                            'timeoutSeconds' : timeoutSeconds
                        };

                        // save the object
                        _data.create('checks', checkID, checkObject, function(err) {
                            if(!err) {
                                // add the check id to the users obect
                                data.checks = userChecks;
                                data.checks.push(checkID);

                                // save the new user data
                                _data.update('users', userPhone, data, function(err) {
                                    if(!err) {
                                        callback(200, checkObject);
                                    } else {
                                        callback(500, {'Error' : 'Could not updat the user with new check'});
                                    }
                                });
                            } else {    
                                callback(500, {'Error' : 'Cant create new checks'});
                            }
                        })
                    } else {
                        callback(400, {'Error' : 'The user alreayd have the max nr of checks' + config.maxChecks});
                    }
                } else {
                    callback(403);
                }
            });
        });
    } else {
        callback(400, {'Error' : 'Missing requiered fields'});
    }
    
};

 module.exports = handlers;