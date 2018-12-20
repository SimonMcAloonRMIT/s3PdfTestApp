var express = require('express');
var awsConfig = require('aws-config');
var AWS = require('aws-sdk');
var fs = require('fs');
var util = require('util');
var pdf = require('html-pdf');
const uuidv4 = require('uuid/v4');

var app = express();

// server static files (cache)
app.use('/cache', express.static(__dirname + '/cache'));

// test API end point
app.get('/', function (req, res) {
    res.send('S3 PDF Test app up and running :)');
 })

 // getImageFromCache
 app.get('/getImageFromCache', function(req, res, next) {

    var filename = req.query.img
    res.sendFile(__dirname + "/cache/" + filename);
});


// Generate PDf Endpoint
app.post("/createPDFHtmlPdfNew", (req, res, next) => {
    console.log("------------------------------------------------");
    util.log('Received S3 PDF Test request');

    // generate uuid
    var uuid = uuidv4();

    uuid = uuid + ".";

    // Test data
    // ---------
    var array = [];
    
    array.push("image0.jpg");
    array.push("image1.gif");
    array.push("image2.jpg");
    array.push("image3.jpg");
    array.push("image4.jpg");
    array.push("image5.jpg");
    array.push("image6.jpg");
    array.push("image7.png");
    array.push("image8.png");
    array.push("image9.jpg");
    array.push("image10.jpg");
    array.push("image11.jpg");
    array.push("image12.jpg");
    array.push("image13.jpg");

    // debug
    // console.log('Files to be donwloaded from s3');
    // for(var i = 0; i < array.length; i++) {
    //     console.log(array[i]);
    // }


    // download files from s3
    // ----------------------
    util.log('Downloading files to cache started...');

    for(var i = 0; i < array.length; i++) {
        var filename = array[i];

        var s3 = new AWS.S3();

        var options = {
            Bucket: 'smc-bucket1',
            Key: filename,
        };

        //console.log('Trying to download - ', filename);

        //add uuid to filename
        var filenameArr = filename.split(".");
        filename = filenameArr[0] + "-" + uuid + filenameArr[1];

        //console.log(filenameArr);
        //console.log(filename);

        // var file = fs.createWriteStream("cache/" + filename);

        // file.on('close', function(){
        //     console.log('File downloaded!');  
        // });

        // s3.getObject(options).createReadStream().on('error', function(err){
        //     console.log(err);
        // }).pipe(file);    

        var file = fs.createWriteStream("cache/" + filename);

        s3.getObject(options)
          .createReadStream()
          .pipe(file)
          .on('finish', function() {
            this.emit('downloadComplete');
            //console.log('download competed.')
          });
    }

    util.log('Downloading files to cache COMPLETE!');

    // Generate PDF
    // -----------
    var content = "<h2>s3 private file cache test</h2><hr />";

    for(var i = 0; i < array.length; i++) {

        var filenameArr = array[i].split(".");
        var filename = filenameArr[0] + "-" + uuid + filenameArr[1];

        content += "<div>" + array[i] + "</div>";
        content += "<img style='width: 200px;' src='http://localhost:3002/getImageFromCache?img=" + filename + "' /><br /><br />"; // using API
        //content += "<img style='width: 200px;' src='http://localhost:3001/cache/" + filename + "' /><br /><br />"; // using static location
    }

    var html = content;
    var finalOptions = "";

    writeToPdf(html, finalOptions, function(err, stream) {
        if (err) return res.status(500).send(err);
        stream.pipe(res);
        //console.log();
        util.log('\x1b[32m%s\x1b[0m', 'PDF generated OK!');  

        // clean up filess
        util.log('Deleting cache files started...');
        for(var i = 0; i < array.length; i++) {

            var filenameArr = array[i].split(".");
            var filename = filenameArr[0] + "-" + uuid + filenameArr[1];    

            fs.unlink(__dirname + "/cache/" + filename, function (err) {
                if (err) throw err;
                // if no error, file has been deleted successfully
                //console.log('File deleted!');
            }); 
        }    
        util.log('Deleting cache files COMPLETE!');
    });    

});

// code from project
function writeToPdf(html, options, callback) {
	//logger.debug('########## html = ' + html);
	if (html.indexOf('<script') == 1 || html.indexOf('<SCRIPT') == 1) {
		//logger.debug('error - html containig malicious script tag');
		//return res.status(500).send('error - html containig malicious script tag');
		return callback('html containing malicious script tag');
	}

    pdf.create(html, options).toStream(callback);
}

// init
var server = app.listen(3002, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("\u001b[2J\u001b[0;0H");
    util.log("S3 PDF Test app listening at http://%s:%s", host, port);
 })


