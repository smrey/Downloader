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

var j = 0;

iterator(appResults, j, function(o){console.log(o)});

function iterator(appRes, j, cb){
    var appResId = appRes[j];
    getFileIds(appResId, function(fileIds) {
            //console.log(fileIds);
        //if (err) {
            //cb(err);
            //return
        //}
        if (appRes.length-1 === j) {
            //cb("File ids retrieved");
            return (console.log("Files retrieved"))
        }
        else {
            console.log("Iterating");
            iterFileId(fileIds, 0);
            //iterFileId(fileIds, 0, function(d) {
                //console.log(d);
                //oneAppRes(); //This isn't being called
            //});
        }
    });
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

function iterFileId(appResFiles, i, done) {
    numFiles = appResFiles.Response.Items.length;
    if (i === (numFiles-1)){
        j+=1;
        return iterator(appResults, j);
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
