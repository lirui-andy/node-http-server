/**
 * 
 * Use Node to serve front-end html/js/css files on localhost development environment.
 * HOW TO USE:
 * 1. Open terminal or cmd or shell command line.
 * 2. cd ./vantage
 * 3. run: node server.js
 * Then you may access http://localhost/vantage/page/login.html
 * 
 * If you got listening 80 error on Mac/Linux, try `sudo node server.js`, because 
 * only root user can open 80 port on Mac/Linux.
 * 
 */


const fs = require("fs");
const url = require("url");
const proxy = require('http-proxy-middleware');
const express = require("express");
const mime = require("mime");


//Where to find the front-end files
const _BASE_ = "./src/main/webapp";

//Front end root context path
const _CONTEXT_ROOT_ = "/vantage";

//Forward api request to backend server.
// const _BACKEND_URL_ = "https://sldcmstg.gps.ihost.com";
const _BACKEND_URL_ = "https://gpscvdev.austin.ibm.com";

///
// Specify local protocal / domain / port
///
const _Local_Server = {
    protocal: "http",
    host: "local.ibm.com",
    port: 8000
}

var app = express();




/**
 * 
 * @param {string} filePath the file path which will be served to client. i.e ./src/main/webapp/page/login.html
 * @param {*} res response
 */
function serveFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.sendStatus(404);
            return
        }

        var contentType = mime.getType(filePath);
        res.setHeader("Content-Type", contentType);
        // res.sendStatus(200);
        res.send(data);
        res.end();
    });
}
/**
 * short hand for /vantage/page/login.html
 */
app.get("/", (req, res)=>{
    res.setHeader("Location", "/vantage/page/login.html");
    res.sendStatus(301);
    res.end();
});


app.all(_CONTEXT_ROOT_+"/page/login*", (req, res, next)=>{
    res.cookie('COOKIE_SUPPORT', 'true', { expires: new Date(2099,1,1), path: "/" });
    next();
});

/**
 * serve path /vantage/*
 */
app.all(_CONTEXT_ROOT_ + "/*", (req, res, next) => {
    var fileName = url.parse(req.url).pathname;
    var destFile = _BASE_ + fileName.substr(_CONTEXT_ROOT_.length);
    // console.debug(fileName + ' ---> ' + destFile);
    if(fileName.endsWith(".html")){
        var d = new Date();
        d.setSeconds(d.getSeconds() +1);
        // res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "max-age=1");
        res.setHeader("Expires", d.toUTCString());
        // res.set
    }
    serveFile(destFile, res);
});

/**
 * serve the config files
 * /cv-maitenance.json, 
 * /cv-homepage.json, 
 * /client_vantage_overview.mp4
 */
app.all(/\/.*\.(json|mp4).*/, (req, res, next) => {
    var fileName = url.parse(req.url).pathname;
    var destFile = "./http" + fileName;
    // console.debug(fileName + ' ---> ' + destFile);
    serveFile(destFile, res);
});

/**
 * Proxy to the back-end server
 */
var theProxy = proxy({
    logLevel: 'info',
    target: _BACKEND_URL_,
    changeOrigin: true,
    ws: true,

    hostRewrite: _Local_Server.host + ":" + _Local_Server.port,
    autoRewrite: true,
    protocolRewrite: _Local_Server.protocal

});

app.use(["/web/*","/api/*","/html/*","/image/*", "/c/*","/c", "/vantage-builder/*"], theProxy);
// app.use("/web/*", theProxy);
// app.use("/api/*", theProxy);
// app.use("/html/*", theProxy);
// app.use("/image/*", theProxy);
// app.use("/c/*", theProxy);
// app.use("/c", theProxy);
// app.use("/vantage-builder/*", theProxy);
// app.use("/testweb", proxy({target:"http://127.0.0.1:3000"}));




app.listen(_Local_Server.port);
console.debug("......")
console.debug('start at '+ _Local_Server.protocal+"://"+_Local_Server.host+":"+_Local_Server.port)