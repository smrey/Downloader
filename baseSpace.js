
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

//temp vars
var fileID = config.get("fileIDexample");
var appResultID = config.get("appResultIDexample");


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

//
function pollAPI(){

}

//Access appResults through projectid
//This is asynchronous- need to put in a callback to ensure that we can access the data

function appResultsByProject(cb){
    var numComplete = 0;
    request.get(
        apiServer + apiVersion + "/projects/" + projectID + "/appresults",
        {qs: {"access_token": accessToken}},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var projectAppResults = JSON.parse(body);
                // console.log(projectAppResults.Response.Items);
                //console.log(projectAppResults);
                //temp below
                appResultsID = projectAppResults.Response.Items[0].Id;
                console.log(appResultsID);
            }
        }
    );
    //cb(response); //Not the right place for the asynchronous return
}

function checkAppResultsComplete(){
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


// Get file IDs- example below for an appresult id to retrieve xlsx and bam files only
function getFileIds() {
    request.get(
        apiServer + apiVersion + "/appresults/" + appResultID + "/files?SortBy=Id&Extensions=.xlsx,.bam&Offset=0&Limit=4&SortDir=Asc",
        {qs: {"access_token": accessToken}},
        function (error, response, body) {
            console.log(body);
            if (!error && response.statusCode == 200) {
                //console.log(body);
            }
        }
    );
}

// Download files- function needs work to specify a location to download to etc.
function downloadFile() {
    request.get(
        apiServer + apiVersion + "/files/" + fileID + "/content",
        {qs: {"access_token": accessToken}},
        function (error, response, body) {
            console.log(body);
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
        }
    );
}

// Call functions
//while (numComplete < numPairs) {
    //pollAPI();
//}
var appResults = appResultsByProject();
//console.log(appResults);

//getFileIds();

//downloadFile();

//Execute pollAPI() after 3 seconds
//setTimeout(pollAPI(), 3000)