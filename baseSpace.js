
var request = require('request');
var config = require('config-json');
var fs = require('fs');
//Load generic config file
config.load("config.json");

var CLIENTKEY = config.get('clientKey');
var CLIENTSECRET = config.get('clientSecret');
var APISERVER = config.get('apiServer');
var APIVERSION = config.get('apiVersion');
//Set the device code from the config file
var DEVICECODE = config.get('deviceCode');
//Set accessToken variable from the config file
var ACCESSTOKEN = config.get('accessToken');
//Load run-specific config file
config.load("runConfig.json");
var NUMPAIRS = config.get("numPairs");
var PROJECTID = config.get("projectID");

// Obtain time at which script was launched to enable later timeout
var STARTTIME = new Date().getTime();

// Variables- adjust these to the desired intervals for polling and timeout of the script
var POLLINGINTERVAL = 5000;
var TIMEOUT = 60000;

//temp vars
var fileID = config.get("fileIDexample");
var appResultID = config.get("appResultIDexample");


/*
//Retrieve information regarding the user associated with the access token
request.get(
    APISERVER+APIVERSION+"/users/current",
    {qs: { "access_token": ACCESSTOKEN }},
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
    APISERVER+APIVERSION+"/users/current/projects?SortBy=Id&Offset=0&Limit=20&SortDir=Asc",
    //"https://api.euc1.sh.basespace.illumina.com/v1pre3/users/current/projects?SortBy=Id&Offset=0&Limit=20&SortDir=Asc",
    {qs: { "access_token": ACCESSTOKEN }},
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
    APISERVER+APIVERSION+"/appsessions/"+appSess,
    {qs: { "access_token": ACCESSTOKEN }},
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

//Access appResults through projectid
//This is asynchronous- need to put in a callback to ensure that we can access the data
function appResultsByProject(cb){
    request.get(
        APISERVER + APIVERSION + "/projects/" + PROJECTID + "/appresults",
        {qs: {"access_token": ACCESSTOKEN}},
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var projectAppResults = JSON.parse(body);
                return cb(projectAppResults);
            }
            else if (response.statusCode !== 200) {
                return cb('Response status is ' + response.statusCode + " " + body);
            }
            else if (error) {
                return cb(error.message);
            }
        }
    );
}

function checkAppResultsComplete(appResults){
    console.log("Running"); //For testing purposes
    var numComplete = 0;
    var appResultsLen = appResults.Response.Items.length;
    // See the status of all of the appSessions
    for (i = 0; i < appResultsLen; i++) {
        if (appResults.Response.Items[i].Status === "Complete") {
            numComplete += 1;
        }
    }
    //Stop execution of the polling function after a certain time has elapsed (assume the process has failed after this time)
    if (new Date().getTime() - STARTTIME > TIMEOUT){
        clearTimeout(poll);
        //Raise error?
    }
    else if (appResultsLen === NUMPAIRS && numComplete === NUMPAIRS) {
        var comp = "all appSessions complete";
        console.log(comp);
        //setTimeout(function(){appResultsByProject(checkAppResultsComplete)}, POLLINGINTERVAL)  //temp for testing

    }
    else {
        setTimeout(function(){appResultsByProject(checkAppResultsComplete)}, POLLINGINTERVAL)
    }
}

// Repeatedly call the function to check if the results are complete or not
function poll(){
    setTimeout(function(){appResultsByProject(checkAppResultsComplete)}, POLLINGINTERVAL); //Increase polling interval for real case
}

// Get file IDs- example below for an appresult id to retrieve xlsx and bam files only
function getFileIds() {
    request.get(
        APISERVER + APIVERSION + "/appresults/" + appResultID + "/files?SortBy=Id&Extensions=.xlsx,.bam&Offset=0&Limit=4&SortDir=Asc",
        {qs: {"access_token": ACCESSTOKEN}},
        function (error, response, body) {
            console.log(body);
            if (!error && response.statusCode === 200) {
                //console.log(body);
            }
        }
    );
}

// Download files
function downloadFile(fileIdentifier, outFile, cb) {
    var file = fs.createWriteStream(outFile);
    //var sendReq =
    var sendReq = request.get(
        APISERVER + APIVERSION + "/files/" + fileIdentifier + "/content",
        {qs: {"access_token": ACCESSTOKEN}},
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                return cb("File " + fileIdentifier + " successfully retrieved")
                //sendReq.pipe(file);
            }
            else if (response.statusCode !== 200) {
                return cb('Response status is ' + response.statusCode + " " + body);
            }
            else if (error) {
                return cb(error.message);
            }
        }
    );
    sendReq.pipe(file)
}

// Call functions
poll();

//Call function asynchronously
 //WORKING HERE
/*
appResultsByProject(function(projectAppResults){
    console.log(projectAppResults);
});
*/

// This function prints the results of the calling function to the output console
var getResults = function(results) {
    console.log(results);
};
// Calling the above function nested in the appResultsByProject function
//appResultsByProject(getResults);

//Attempt at CPS style
//console.log(appResultsByProject(checkAppResultsComplete));

//getFileIds();

//Rudimentary file download working below
// Download a file
/*
var outputFile = "fout.xlsx";
downloadFile(fileID, outputFile, function(item){
    console.log(item);
});
*/

//Download file, version without printout- don't use as can't see callback error messages
/*
downloadFile(fileID, outputFile, function(){});
*/

//Execute pollAPI() after 3 seconds
//setTimeout(pollAPI(), 3000)