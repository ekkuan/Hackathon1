var chokidar = require('chokidar');
var express = require('express')
var AWS = require('aws-sdk')
const uuidV1 = require('uuid/v1');
var fs = require('fs')
var s3 = new AWS.S3();

// For details and examples about AWS Node SDK,
// please see https://aws.amazon.com/sdk-for-node-js/

var myBucket = 'cs499-h1';
var app = express()

var watcher = chokidar.watch('file, dir, or glob', {
  ignored: /[\/\\]\./, persistent: true
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var log = console.log.bind(console);

watcher
  .on('add', function(path) { log('File', path, 'has been added'); })
  .on('addDir', function(path) { log('Directory', path, 'has been added'); })
  .on('change', function(path) { log('File', path, 'has been changed'); })
  .on('unlink', function(path) { log('File', path, 'has been removed'); })
  .on('unlinkDir', function(path) { log('Directory', path, 'has been removed'); })
  .on('error', function(error) { log('Error happened', error); })
  .on('ready', function() { log('Initial scan complete. Ready for changes.'); })
  .on('raw', function(event, path, details) { log('Raw event info:', event, path, details); })

// 'add', 'addDir' and 'change' events also receive stat() results as second
// argument when available: http://nodejs.org/api/fs.html#fs_class_fs_stats
watcher.on('change', function(path, stats) {
  if (stats) console.log('File', path, 'changed size to', stats.size);
});

// Watch new files.
watcher.add('new-file');
watcher.add(['new-file-2', 'new-file-3', '**/other-file*']);

// Un-watch some files.
watcher.unwatch('new-file*');

// Only needed if watching is `persistent: true`.
watcher.close();

// One-liner
require('chokidar').watch('.', {ignored: /[\/\\]\./}).on('all', function(event, path) {
  if(event=="add"){
  	uploadFileToS3(path)
  } else if (event=="unlink") {
	deleteFileFromS3(path)
  } else if (event=="change") {
  	//console.log("File Updated")
  	updateFileToS3(path)
  }
  console.log(event, path);
});

function uploadFileToS3(imageFilePath) {
	fs.readFile(imageFilePath, function(err, data) {
		params = {Bucket: myBucket, Key: imageFilePath, Body: data, ACL: "public-read", ContentType: "image/png"};
	    s3.putObject(params, function(err, data) {
	         if (err) {
	             console.log(err)
	         } else {
	             console.log("Successfully uploaded data to " + myBucket, data);
	         }
	    });
	});
}

function deleteFileFromS3(imageFilePath) {
	var params = {
        	Bucket: myBucket ,
        	Key: imageFilePath
    	};
    	s3.deleteObject(params, function (err, data) {
        if (data) {
            console.log("File removed successfully from " + myBucket);
        }
        else {
            console.log("Check if you have sufficient permissions : "+err);
        }
    });
}

function updateFileToS3(imageFilePath) {
	fs.readFile(imageFilePath, function(err, data) {
                params = {Bucket: myBucket, Key: imageFilePath, Body: data, ACL: "public-read", ContentType: "image/png"};
            s3.putObject(params, function(err, data) {
                 if (err) {
                     console.log(err)
                 } else {
                     console.log("Successfully updated data to " + myBucket, data);
                 }
            });
        });
}

app.listen(3000, function() {
	console.log('FileCheck app listening on port 3000!')
})














