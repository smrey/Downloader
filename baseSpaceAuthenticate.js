
const opn = require('opn');
var request = require('request');
var config = require('config-json');
config.load("config.json");

var clientKey = config.get('clientKey');
var clientSecret = config.get('clientSecret');
var apiServer = config.get('apiServer');
var apiVersion = config.get('apiVersion');
//var deviceCode = ''; //Is there a better way to initialise a variable?
var deviceCode = config.get('deviceCode');

//Ensure that user is previously logged on to the correct instance of BaseSpace (e.g. pmg1) and in the correct location
//e.g. Cardiff or SMP2
//Request authorisation for device

request.post(
    apiServer+apiVersion+"/oauthv2/deviceauthorization",
    { json: { "client_id": clientKey, "response_type": "device_code", "scope": "BROWSE GLOBAL, CREATE GLOBAL, CREATE PROJECTS" }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
            //Get the device code from the JSON body output
            deviceCode = body.device_code;
            console.log(deviceCode)
            //Open the url for the validation of the access
            opn(body.verification_with_code_uri)
        }
    }
);

/*
function readJSON(filename){
    return readFile(filename, 'utf8').then(function (res){
        return JSON.parse(res)
    })
}
*/

/*
//Loop this until 200 is returned or timeout
request.post(
    apiServer+apiVersion+"/oauthv2/token",
    { json: { "client_id": clientKey, "client_secret": clientSecret, "code": deviceCode, "grant_type": "device" }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);
*/

/*
//Set access_token variable to returned value from polling
var access_token = '';
*/

/*
NOTES
In Asynchronous Programming (which uses continuation-passing style):
Note that JavaScript has run-to-completion semantics, which means that the current task is always finished before
the next task is executed. Meaning console.log commands will be executed before functions. The functions are added
to the task queue immediately but only executed after the current piece of code is complete.
The Worker API is useful to avoid blocking the event loop.
*/