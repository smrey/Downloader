
//Create a config file containing the keys for access to BaseSpace using this application
//var Config = require('config-js')??

var request = require('request');

request.post(
    "https://api.euc1.sh.basespace.illumina.com/v1pre3/oauthv2/deviceauthorization",
    { json: { "client_id": client_key, "response_type": "device_code", "scope": "BROWSE GLOBAL, CREATE GLOBAL" }},
    function (error, response, body) {
        console.log(body)
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);

//Ensure that user is previously logged on to the correct instance of BaseSpace (e.g. pmg1) and in the correct location
//e.g. Cardiff or SMP2

//Open the url for the validation of the access

//Set the device code to the response from the previous step
var device_code = '';

//Loop this until 200 is returned or timeout
request.post(
    "https://api.euc1.sh.basespace.illumina.com/v1pre3/oauthv2/token",
    { json: { "client_id": client_key, "client_secret": client_secret, "code": device_code, "grant_type": "device" }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);

//Set access_token variable to returned value from polling
var access_token = '';