/*
 * Libary use for store and editing data
 *
 */

// Dependecies
var fs = require('fs');
var path = require('path'); // use to normalize the path to diff. dirs.
var helpers = require('./helpers');

// Container for this module
var lib = {};

// Define the base directory for the data folder
lib.baseDir = path.join(__dirname, '/../.data/') // generate the path for .data dir.

// Function to wirte data to a file
lib.create = function(dir, file, data, callback) { // dir = directory name; file = file where to write; data = data to write
    // Try to open the file for writing: we'll try to write in the file form the dir. specified form .data dir
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor) {
        // u cant think to fileDescriptor as an uniq way to describe a file
        if(!err && fileDescriptor) {
            // Convert Data to String
            var stringData = JSON.stringify(data);

            // Wirte to file and close it
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if(!err) {
                    //close the file
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false); // a false error is a good thing, cuz we use calback error pathern and we expect err
                        } else {
                            callback('Err. closing new file!');
                        }
                    });    
                } else {
                    callback('Err. writing to new file!');
                }
            });
        } else {
            // 'wx' - flag give error out if the file already exist
            //callback an error; we use a callback error pathern, so will use an err. string
            callback('Could not create new file, it may already exist!');
        }
    });
};

// Read data from a file
lib.read = function(dir, file, callback) {
    // Try to read it
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', function(err, data) {
        if(!err && data) {
            /*
                we'll call back the parsed Json data, sice we know we're
                alweays store Json, is easy to return Json then raw text
            */
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
}

// Update an existing file with new data
lib.update = function(dir, file, data, callback) {
    // try to open
    // the diff. btw 'r+' and 'wx' is:when we open file for wirting, will error out fi the file doesn't exist
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            //Convert our data to string
            var stringData = JSON.stringify(data);

            //update the file with our new data: we'll truncate the content of that file before we wirte on top of it
            fs.truncate(fileDescriptor, function(err) {
                if(!err) {
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if(!err) {
                            fs.close(fileDescriptor, function(err) {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Err. close file!');
                                }
                            });
                        } else {
                            callback("ERR. writing to exsiting file!");
                        }
                    });
                } else {
                    callback("Error truncating file!");
                }
            });

        } else {
            callback("File u try to update doesn't exist");
        }
    });
}

// Delete a file
lib.delete = function(dir, file, callback) {
    // Unlinking the file - mean removing the file form the file sistems
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err) {
        if(!err) {
            callback(false);
        } else {
            callback("Can t unlik this file!");
        }
    });
};

// Export the module
module.exports = lib;