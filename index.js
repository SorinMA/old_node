 /*
 * Info: This is the main file
 * Data:27 - 02 - 2019 
 * 
 */

 //Dependencies
 var http = require('http');
 var https = require('https');
 var url = require('url');
 var StringDecoder = require('string_decoder').StringDecoder;
 var config = require('./config');
 var fs = require('fs');  
 var _data = require('./lib/data');
 var handlers = require('./lib/handlers');
 var helpers = require('./lib/helpers');

 // TESTING
 // @TODO delete this
 /*
 _data.delete('test','Vasile', function(err) {
  console.log('the write error was:' + err);
 });*/

 //Config HTTP server
 var httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
 });

  //Start HTTP server
  httpServer.listen(config.httpPort, function() {
    console.log("HTTP: We're ON on enviroment:"+ config.envName +" | on port:"+ config.httpPort +" port!");
 });


 //Config HTTPS server
 var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
 };
 var httpsServer = https.createServer(httpsServerOptions, function(req, res) {
    unifiedServer(req, res);
 });
 
 //Start HTTPS server
 httpsServer.listen(config.httpsPort, function() {
    console.log("HTTPS: We're ON on enviroment:"+ config.envName +" | on port:"+ config.httpsPort +" port!");
 });

 // All the server logic for both http and https servers
 var unifiedServer = function(req, res) {
    //Get the URL
    var parsedURL = url.parse(req.url, true);
    
    //Get the path
    var path = parsedURL.pathname;
    var pathReq = path.replace(/^\/+|\/+$/g,'');

    //Get the querry string as an obj
    var querryStringObejct = parsedURL.query;

    //Get the headers as obj
    var headers = req.headers;

    //Get the HTTP method
    var method = req.method.toLowerCase();

    //Get the payload, if exist
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function(data) {
      buffer += decoder.write(data);
    });

    req.on('end', function() {
      buffer += decoder.end();

      //Choosle the hamdler this request should do. If one is not found, use .notFound handler
      var chosenHandler = typeof(router[pathReq]) !== 'undefined' ? router[pathReq] : handlers.notFound;

      //Construct the data obj to send to the handler
      var data = { 
         'trimmedPath' : pathReq,
         'queryStringObject' : querryStringObejct,
         'method' : method,
         'headers' : headers,
         'payload' : helpers.parseJsonToObject(buffer) //make sure that he payload that s comming form the handler isn t just a raw buffer, but is actualy the parsed JSON data
      };

      // Route the request to the hndler specified in the router
      chosenHandler(data, function(statusCode, payload) {
         // use the status code called back by the handler, or default to 200
         statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

         // use the payload called back by the handler, or default to an empty string
         payload = typeof(payload) == 'object' ? payload : {};

         // Convert the payload to a string
         var payloadString = JSON.stringify(payload);

         //return the respons
         res.setHeader('Content-Type', 'application/json');
         res.writeHead(statusCode);
         res.end(payloadString);

         //Log the path
         console.log("Returining this response: " + statusCode, payloadString);

      });

    });

 /* because we add the payload unctionality, we will offer the response in end event emiter
    //send the response
    res.end("Welp, we'r on for now!");

    //log the path
    console.log('Path req.:' + pathReq + ' method:' + method);
 */
 };

 //Define a request router
 var router = {
   'ping' : handlers.ping,
   'users' : handlers.users,
   'tokens' : handlers.tokens,
   'checks' : handlers.checks
 };