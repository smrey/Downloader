var request = require('request');
var config = require('config-json');
var fs = require('fs');
//Load generic config file
config.load("config.json");

var APISERVER = config.get('apiServer');
var APIVERSION = config.get('apiVersion');
var ACCESSTOKEN = config.get('accessToken');
var NEGATIVECONTROL = "NTC";
// Variables which may need adjusting
var TEMPLATE = "SMP2_CRUK_V2_03.15.xlsx"; //Update manually if it changes

appResults = [ '1077084', '1080080', '1080081', '1080082', '1081081' ];

//var i = 0;

iterator(appResults, function(o){console.log(o)});

function iterator(appRes, cb){
    var appR = appRes.slice(0);
    console.log(appR);
    (function oneAppRes() {
        var appResId = appR.splice(0, 1)[0];
        //console.log(appResId);
        getFileIds(appResId, function(fileIds) {
            //console.log(fileIds);
        //if (err) {
            //cb(err);
            //return
        //}
        if (appR.length === 0) {
            cb("File ids retrieved");
        }
        else {
            iterFileId(fileIds, 0, function(d) {
                console.log(d);
                console.log("Iterating again");
                oneAppRes(); //This isn't being called
            });
        }
        });
    })();
}

/*
for (var i = 0; i < appResults.length; i++) {
    iterAppRes(appResults, i, function(appResId) {
        console.log(appResId);
        getFileIds(appResId, function(fileIds) {
            //console.log(s);
            iterFileId(fileIds, 0, function(fileIdName) {
                console.log(fileIdName);
                //downloadFile(fileIdName[1], fileIdName[0], function (h) {
                //});
            });
        });
    });
}
*/

/*
iterAppRes(appResults, i, function(appResId) {
    console.log(appResId);
    getFileIds(appResId, function(fileIds) {
        //console.log(s);
        iterFileId(fileIds, 0, function(fileIdName) {
            console.log(fileIdName);
            //downloadFile(fileIdName[1], fileIdName[0], function (h) {
            //});
        });
    });
});
*/

// Iterate over appresults ids to get all file ids
function iterAppRes(appResArr, i, cb){
    if (i < appResArr.length) {
        //console.log(appResArr[i]);
        //Do function call
        //This bit here needs to be a callback
        //getFileIds(appResArr[i], function(ret){
        //console.log(ret);
        //iterAppRes(appResArr, i+1);
        return cb(appResArr[i], console.log("App results successfully retrieved"));
        //});
    }
}

function iterFileId(appResFiles, i, cb) {
    numFiles = appResFiles.Response.Items.length;
    if (i === (numFiles-1)){
        return (console.log("Files download completed"));
    }
    if (i < (numFiles-1)) {
        var fileId = appResFiles.Response.Items[i].Id;
        console.log(fileId);
        var fileName = appResFiles.Response.Items[i].Name;
        if (fileName !== TEMPLATE && fileName !== NEGATIVECONTROL + ".bam") {
            downloadFile(fileId, fileName, function(y){console.log(y), iterFileId(appResFiles, i+1);});
        }
    }
}


// Get file IDs- example below for an appresult id to retrieve xlsx, bam and bai files only
function getFileIds(appResultId, cb) {
    console.log("Getting file Ids");
    console.log(appResultId);
    request.get(
        APISERVER + APIVERSION + "/appresults/" + appResultId + "/files?SortBy=Id&Extensions=.xlsx,.bai&Offset=0&Limit=50&SortDir=Asc",
        {qs: {"access_token": ACCESSTOKEN}},
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var appResultFiles = JSON.parse(body);
                return cb(appResultFiles);
                //return cb(iterFileId(appResultFiles,0, function(p){console.log(p)}));
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
        {qs: {"access_token": ACCESSTOKEN}}).pipe(writeFile).on('close', function(){cb("Download Success " + outFile)});
}
