
var request = require('request');
var config = require('config-json');
//Load generic config file
config.load("config.json");

var clientKey = config.get('clientKey');
var clientSecret = config.get('clientSecret');
var apiServer = config.get('apiServer');
var apiVersion = config.get('apiVersion');
//Set the device code from the config file
var deviceCode = config.get('deviceCode');
//Set accessToken variable from the config file
var accessToken = config.get('accessToken');
//Load run-specific config file
config.load("runConfig.json");
var numPairs = config.get("numPairs");
var projectID = config.get("projectID");


/*
//Retrieve information regarding the user associated with the access token
request.get(
    apiServer+apiVersion+"/users/current",
    {qs: { "access_token": accessToken }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);
*/

/*
//Retrieve all projects associated with the user associated with the access token
request.get(
    apiServer+apiVersion+"/users/current/projects?SortBy=Id&Offset=0&Limit=20&SortDir=Asc",
    //"https://api.euc1.sh.basespace.illumina.com/v1pre3/users/current/projects?SortBy=Id&Offset=0&Limit=20&SortDir=Asc",
    {qs: { "access_token": accessToken }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);
*/

/*
//Information regarding project id 1513512
request.get(
    apiServer+apiVersion+"/projects/1513512",
    {qs: { "access_token": accessToken }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);
*/

/*
//Appresults from project id 1513512
//Can use this by Status key to figure out when is complete
//Can use AppSession key to get appsession ID
//Might be a key to get the appresults- "Id" (nested a bit)- probably within each different appsessionid
//From this result could potentially use nested "Name" key to retrieve associated data
request.get(
    apiServer+apiVersion+"/projects/1513512/appresults",
    {qs: { "access_token": accessToken }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);
*/

/*
//Files in appresult 770770
request.get(
    apiServer+apiVersion+"/appresults/770770/files?SortBy=Id&Extensions=.bam&Offset=0&Limit=20&SortDir=Asc",
    {qs: { "access_token": accessToken }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);
*/

//Download file- insufficient permissions to download file- do later

/*
//Create project
request.post(
    apiServer+apiVersion+"/projects",
    {qs: { "access_token": accessToken, "Name": "Proj" }},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);
*/

/*
var appSess = '';

//Attempt polling- initial attempt to be polled- this probably won't work
request.get(
    apiServer+apiVersion+"/appsessions/"+appSess,
    {qs: { "access_token": accessToken }},
    function (error, response, body) {
        console.log(body)
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);
*/

//Wait a bit before starting polling as it is known they won't be ready for a while- previous script


//Attempt appResults through projectid

function pollAPI(){
    var numComplete = 0;
    request.get(
        apiServer + apiVersion + "/projects/" + projectID + "/appresults",
        {qs: {"access_token": accessToken}},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var projectAppResults = JSON.parse(body);
                var projectAppResultsLen = projectAppResults.Response.Items.length;
                //console.log(projectAppResultsLen);
                // See the status of all of the appSessions
                for (i = 0; i < projectAppResultsLen; i++) {
                    //console.log(projectAppResults.Response.Items[i].Status);
                    if (projectAppResults.Response.Items[i].Status === "Complete") {
                        numComplete += 1;
                    }
                }
                if (projectAppResultsLen === numPairs && numComplete === numPairs) {
                    console.log("all appSessions complete")
                }
                else{console.log(projectID);}
                //if (projectAppResultsLen !== numPairs || numComplete !== numPairs) {
                //console.log("automated download failed");
                //return "automated download failed";
                //}
            }
        }
    );
}

// Call functions
//while (numComplete < numPairs) {
    //pollAPI();
//}
pollAPI();

//Execute pollAPI() after 3 seconds
//setTimeout(pollAPI(), 3000)