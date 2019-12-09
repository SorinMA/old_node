
 /*
  *Create and export config variables 
  *
  * 
  */
  
  // Container for all the enviroments
  var enviroments = {}; // this is the obj that will hold all the enviroments

  //  Staging (default) enviroment
  enviroments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'maxChecks' : 5
  };

  // Production enviroments
  enviroments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001, 
    'envName' : 'production',
    'hashingSecret' : 'thisIsAlsoASecret',
    'maxChecks' : 5
  };

  // Determinee whitch enviroment should be exoprted out (which env was passed as a cmd arg)
  var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLocaleLowerCase() : '';

  // Check that the currentEnviroment is one of the enviroments above, if not, default staging
  var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

  // Export the module
  module.exports = enviromentToExport;

