
var request = require('request');
var config = require('config-json');
var fs = require('fs');
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
    request.get(
        apiServer + apiVersion + "/projects/" + projectID + "/appresults",
        {qs: {"access_token": accessToken}},
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

function checkAppResultsComplete(){
    var res = appResultsByProject(getResults);
    var projectAppResultsLen = res.Response.Items.length;
    console.log(projectAppResultsLen);
    // See the status of all of the appSessions
    /*
    for (i = 0; i < projectAppResultsLen; i++) {
        //console.log(projectAppResults.Response.Items[i].Status);
        if (appResults.Response.Items[i].Status === "Complete") {
            numComplete += 1;
        }
    }
    if (appResultsLen === numPairs && numComplete === numPairs) {
        console.log("all appSessions complete")
    }
    else{console.log("something else");}
    //if (projectAppResultsLen !== numPairs || numComplete !== numPairs) {
    //console.log("automated download failed");
    //return "automated download failed";
    //}
    */
}


// Get file IDs- example below for an appresult id to retrieve xlsx and bam files only
function getFileIds() {
    request.get(
        apiServer + apiVersion + "/appresults/" + appResultID + "/files?SortBy=Id&Extensions=.xlsx,.bam&Offset=0&Limit=4&SortDir=Asc",
        {qs: {"access_token": accessToken}},
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
        apiServer + apiVersion + "/files/" + fileIdentifier + "/content",
        {qs: {"access_token": accessToken}},
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
//while (numComplete < numPairs) {
    //pollAPI();
//}

//Call function asynchronously
 //WORKING HERE
/*
appResultsByProject(function(projectAppResults){
    console.log(projectAppResults);
});
*/

var getResults = function(results) {
    console.log(results);
};

//appResultsByProject(getResults);

checkAppResultsComplete();

/*
checkAppResultsComplete(appResultsByProject(getResults)) {
    console.log(m);
}
*/


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