
var request = require('request');
var config = require('config-json');
var fs = require('fs');
//Load generic config file
config.load("config.json");

//var CLIENTKEY = config.get('clientKey');
//var CLIENTSECRET = config.get('clientSecret');
var APISERVER = config.get('apiServer');
var APIVERSION = config.get('apiVersion');
//Set the device code from the config file
//var DEVICECODE = config.get('deviceCode');
//Set accessToken variable from the config file
var ACCESSTOKEN = config.get('accessToken');
//Load run-specific config file
config.load("runConfig.json");
var NUMPAIRS = config.get("numPairs");
var PROJECTID = config.get("projectID");
var NEGATIVECONTROL = config.get("negativeControl");

// Obtain time at which script was launched to enable later timeout
var STARTTIME = new Date().getTime();

var FILES = [];

// Variables which may need adjusting
var TEMPLATE = "SMP2_CRUK_V2_03.15.xlsx"; //Update manually if it changes

// Variables- adjust these to the desired intervals for polling and timeout of the script
var POLLINGINTERVAL = 60000;
var TIMEOUT = 720000; // 60000 is 1 minute // 7200000 is 2 hours

//temp vars
var fileID = config.get("fileIDexample");
var appResultID = config.get("appResultIDexample");

//Access appResults through projectid
//This is asynchronous- need to put in a callback to ensure that we can access the data
function appResultsByProject(cb){
    request.get(
        APISERVER + APIVERSION + "/projects/" + PROJECTID + "/appresults",
        {qs: {"access_token": ACCESSTOKEN}},
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var projectAppResults = JSON.parse(body);
                return cb(projectAppResults, console.log("App results successfully retrieved"));
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

function checkAppResultsComplete(appResults, refresh, cb) {
    console.log("Running"); //For testing purposes
    var numComplete = 0;
    var appResultsLen = appResults.Response.Items.length;
    var appResultsArr = [];
    // See the status of all of the appSessions
    for (i = 0; i < appResultsLen; i++) {
        if (appResults.Response.Items[i].Status === "Complete") {
            numComplete += 1;
            // Store the appResults IDs which are needed for downloading the files
            appResultsArr[i] = appResults.Response.Items[i].Id;
        }
    }
    //Stop execution of the polling function after a certain time has elapsed (assume the process has failed after this time)
    if (new Date().getTime() - STARTTIME > TIMEOUT) {
        clearInterval(refresh);
        return cb("Polling timed out");
        //Raise error?
    }
    else if (appResultsLen === NUMPAIRS && numComplete === NUMPAIRS) {
        clearInterval(refresh);
        console.log("all appSessions complete");
        //setTimeout(function(){appResultsByProject(checkAppResultsComplete)}, POLLINGINTERVAL)  //temp for testing
        //In here want to call another function to kick off getting appresults, getting fileids and download of results
        return cb(appResultsArr);
        //return cb(iterAppRes(appResultsArr, 0, function(){}));
    }
}

// Repeatedly call the function to check if the results are complete or not
function poll(cb){
    var refresh = setInterval(function(){
        appResultsByProject(function(appRes){
            checkAppResultsComplete(appRes, refresh, function(appResIds) {
                //console.log(appRes);
                //Working here
                iterAppRes(appResIds, 0, function(appResId){
                    console.log(appResId);
                    getFileIds(appResId, function(fileIds){
                        //console.log(s);
                        iterFileId(fileIds, 0, function(fileIdName){
                            console.log(fileIdName);
                            downloadFile(fileIdName[1],fileIdName[0], function(h){});
                        });
                    });
                });
            });
        });
    }, POLLINGINTERVAL);
}

//WORKING HERE

// Iterate over appresults ids to get all file ids
function iterAppRes(appResArr, i, cb){
    if (i < appResArr.length) {
        //console.log(appResArr[i]);
        //Do function call
        //This bit here needs to be a callback
        //getFileIds(appResArr[i], function(ret){
            //console.log(ret);
        return cb(appResArr[i], console.log("App results successfully retrieved"));
        //iterAppRes(appResArr, i+1); //Note that without this it will only do the first app res for now- TESTING
        //});
    }
}

function iterFileId(appResFiles, i, cb) {
    if (i < appResFiles.Response.Items.length) {
        var f = [];
        var fileId = appResFiles.Response.Items[i].Id;
        console.log(fileId);
        var fileName = appResFiles.Response.Items[i].Name;
        if (fileName !== TEMPLATE && fileName !== NEGATIVECONTROL + ".bam") {
            //FILES.push({ [fileName] : fileID}); // Syntax unsupported except in ES6
            //var tempObj = {};
            //tempObj[fileName] = fileID;
            //FILES.push(tempObj);
            f[0] = fileName;
            f[1] = fileID;
            return cb(f);
            // Implement callback properly here- it isn't working- file download function is not downloading files
            //downloadFile(fileId, fileName, function(y){
                //console.log(y);
                //iterFileId(appResFiles, i+1);
            //});
        }
    }
    //return (console.log(FILES));
}


// Get file IDs- example below for an appresult id to retrieve xlsx, bam and bai files only
function getFileIds(appResultId, cb) {
    console.log("Getting file Ids");
    console.log(appResultId);
    request.get(
        APISERVER + APIVERSION + "/appresults/" + appResultId + "/files?SortBy=Id&Extensions=.xlsx,.bam,.bai&Offset=0&Limit=50&SortDir=Asc",
        {qs: {"access_token": ACCESSTOKEN}},
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var appResultFiles = JSON.parse(body);
                return cb(appResultFiles, 0);
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

// Download files- needs error handling, but working
function downloadFile(fileIdentifier, outFile, cb) {
    var writeFile = fs.createWriteStream(outFile);
    request.get(
        APISERVER + APIVERSION + "/files/" + fileIdentifier + "/content",
        {qs: {"access_token": ACCESSTOKEN}}).pipe(writeFile).on('close', function(){cb()});


        /*
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                file = body;
                console.log(file);
                var r = file.pipe(writeFile);
                */

                /*
                return cb(writeFile.on('close', function(){
                    sendReq.pipe(writeFile);
                    console.log("File " + fileIdentifier + " successfully retrieved");
                }));


                //return cb("File " + fileIdentifier + " successfully retrieved");
                //sendReq.pipe(writefile);
            }
            else if (response.statusCode !== 200) {
                return cb('Response status is ' + response.statusCode + " " + body);
            }
            else if (error) {
                return cb(error.message);
            }
        }
    );
    */
}

// Call functions
// Also need to fit in iteration somewhere

poll(function(x){
    console.log(x);
});

