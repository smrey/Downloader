/*
Script to poll the status of the SMP2 app running in Illumina BaseSpace and download required files
once the app has completed
Description: CRUK BaseSpace app pipeline
Author: Sara Rey
Status: DEVELOPMENT/TESTING
Version: "1.1.0"
*/

"use strict";

//Obtain first command line argument
//var nano = process.argv.slice(2);

// Load node modules
const path = require('path');
//var request = require(nano + path.sep + path.join('node_modules', 'request'));
var request = require('request');
var fs = require('fs');
// Load configuration files
var config = JSON.parse(fs.readFileSync(path.join(path.normalize('.'), 'config.json')));
var runconfig = JSON.parse(fs.readFileSync(path.join(path.normalize('.'), 'runConfig.json')));

// Obtain and set variables from configuration files
var APISERVER = config.apiServer;
var APIVERSION = config.apiVersion;
var ACCESSTOKEN = config.accessToken;
var NUMPAIRS = parseInt(runconfig.numPairs);
var PROJECTID = runconfig.projectID;
var NEGATIVECONTROL = runconfig.negativeControl;

// Obtain time at which script was launched to enable later timeout
var STARTTIME = new Date().getTime();

// Global variables required for re-calling outer iteration
var J;
var APPRES;

// Variables which may need adjusting
// Illumina named template for Excel results spreadsheet
var TEMPLATE = "SMP2_CRUK_V2_03.15.xlsx"; //Update manually if it changes
// Desired location of output files
var OUTPATH = path.join(path.normalize('.'), "results"); //Change if output location of files changes

// Variables for desired intervals for polling and timeout of the script
var POLLINGINTERVAL = 10000; //Change to 60000 for live
var TIMEOUT = 7200000; // 60000 is 1 minute // 7200000 is 2 hours

// Access datasets through projectid
function appResultsByProject(cb){
    request.get(
        APISERVER + APIVERSION + "/projects/" + PROJECTID + "/datasets",
        {qs: {"access_token": ACCESSTOKEN, "limit": "30"}},
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var projectAppResults = JSON.parse(body);
                //console.log(projectAppResults);
                return cb(null, projectAppResults, console.log("App results successfully retrieved"));
            }
            else if (response.statusCode !== 200) {
                return cb(Error('Response status is ' + response.statusCode + " " + body));
            }
            else if (error) {
                return cb(Error(error.message));
            }
        }
    );
}

// Check whether the app has completed for all of the sample pairs on the sequencing run
function checkAppResultsComplete(appResults, refresh, cb) {
    console.log("Checking status of app results");
    var numComplete = 0;
    var appResultsLen = appResults.Response.Items.length;
    var appResultsArr = [];
    // See the status of all of the appSessions
    for (var i = 0; i < appResultsLen; i++) {
        if (appResults.Response.Items[i].Status === "Complete") {
            numComplete += 1;
            // Store the appResults IDs which are needed for downloading the files
            appResultsArr[i] = appResults.Response.Items[i].Id;
        }
    }

    // Stop execution of the polling function after a certain time has elapsed
    if (new Date().getTime() - STARTTIME > TIMEOUT) {
        clearInterval(refresh);
        return cb(Error("Polling timed out"));
    }
    // Return app results when the app has completed for all samples. Also includes a check to ensure that
    // the correct number of expected tumour sample pairs have completed
    else if (appResultsLen === NUMPAIRS && numComplete === NUMPAIRS) {
        clearInterval(refresh);
        console.log("All appSessions complete");
        return cb(null, appResultsArr);
    }
}

// Iterate over the app results for every sample (one app result per sample)
function iterAppRes(appRes, j, cb) {
    try {
        var appResId = appRes[j];
    }
    catch(err) {
        throw new Error(console.log("Error in iterAppRes " + err));
    }
    if (appRes.length === j) {
        return (console.log("Files retrieved"))
    }
    getFileIds(appResId, function(err, fileIds) {
        if (err) {
            return cb(Error(err));
        }
        else {
            try {
                iterFileId(fileIds, 0, j);
            }
            catch(err) {
                throw new Error(console.log("Error in launch of iterFileId " + err));
            }
        }
    });
}

// Iterate over the files within each app result (several files per app result)
function iterFileId(appResFiles, i) {
    var numFiles = appResFiles.Response.Items.length;
    try {
        if (i === (numFiles)) {
            J += 1;
            return iterAppRes(APPRES, J);
        }
    }
    catch(err) {
        throw new Error(console.log("iterFileId error at return to iterator function " + err));
    }
    if (i < (numFiles)) {
        try {
            var fileId = appResFiles.Response.Items[i].Id;
            var fileName = appResFiles.Response.Items[i].Name;
        }
        catch(err) {
            throw new Error(console.log("iterFileId error- issue with appResults " + err));
        }
        if (fileName === TEMPLATE || fileName === NEGATIVECONTROL + ".bam") {
            try {
                iterFileId(appResFiles, i + 1);
            }
            catch(err) {
                throw new Error(console.log("iterFileId error at recursive call " + err));
        }
	}
	else {
            downloadFile(fileId, fileName, function(err, result){
                if (err) {
                    throw new Error(console.log("File download failed ") + err);
                }
                else {
                    console.log(result);
                    try {
                        iterFileId(appResFiles, i + 1);
                    }
                    catch(err) {
                        throw new Error(console.log("iterFileId error at recursive call " + err));
                    }
		        }
	        });
        }
    }
}

// Get file IDs in each app result. Retrieve xlsx, bam and bai files only.
function getFileIds(appResultId, cb) {
    console.log("Getting file Ids for " + appResultId);
    request.get(
        APISERVER + APIVERSION + "/appresults/" + appResultId + "/files?SortBy=Id&Extensions=.xlsx,.bai" +
        "&Offset=0&Limit=50&SortDir=Asc",
        {qs: {"access_token": ACCESSTOKEN}},
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var appResultFiles = JSON.parse(body);
                return cb(null, appResultFiles);
            }
            else if (response.statusCode !== 200) {
                return cb(Error('Response status is ' + response.statusCode + " " + body));
            }
            else if (error) {
                return cb(Error(error.message));
            }
        }
    );
}

// Download files by file identifier
function downloadFile(fileIdentifier, outFile, cb) {
    var writeFile = fs.createWriteStream(path.join(OUTPATH, outFile));
    request.get(
        APISERVER + APIVERSION + "/files/" + fileIdentifier + "/content",
        {qs: {"access_token": ACCESSTOKEN}}).on('error', function(err) {cb(Error(err))})
        .pipe(writeFile).on('close', function(){cb(null, "Download Success " + outFile)});

}

// Repeatedly call the function to check if the results are complete or not
function poll(){
    var refresh = setInterval(function(){
        appResultsByProject(function(err, appRes){
            if (err) throw new Error(console.log(err));
            checkAppResultsComplete(appRes, refresh, function(err, appResIds) {
                if (err) throw new Error(console.log(err));
                iterAppRes(APPRES=appResIds, J=0, function(output){
                    console.log(output)});
            });
        });
    }, POLLINGINTERVAL);
}


// Call initial function
//poll();
appResultsByProject(function(err, appRes){
    if(err) {
        throw new Error(console.log(err));
    }
    else {
        //console.log(appRes);
        //console.log(appRes.Items.length);
        for (var i = 0; i < appRes.Items.length; i++) {
            //console.log(appRes.Items[i]);
            //console.log(appRes.Items[i].Name);
            //console.log(appRes.Items[i].DatasetType);
            if (appRes.Items[i].Name === "SMP2") {
                console.log(appRes.Items[i].Name);
                console.log(appRes.Items[i].AppSession.ExecutionStatus);
            }
        }
    }
});
