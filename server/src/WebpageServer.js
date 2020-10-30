require('dotenv').config({ path: `${__dirname}/.env` });
const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const socketIO = require('socket.io')(http);
const favicon = require('serve-favicon');
const path = require('path');
const sockets = {};
let socketCount = -1;

let webpageReady = false;

function WebpageServer() {
    startServer();

    this.moveForward = duration => Object.keys(sockets).forEach( key => sockets[key].emit('moveForward', duration) );
    this.moveBackward = duration => Object.keys(sockets).forEach( key => sockets[key].emit('moveBackward', duration) );
    this.turnRight = duration => Object.keys(sockets).forEach( key => sockets[key].emit('turnRight', duration) );
    this.turnLeft = duration => Object.keys(sockets).forEach( key => sockets[key].emit('turnLeft', duration) );
    this.alarm = () => Object.keys(sockets).forEach( key => sockets[key].emit('alarm') );
}

function startServer() {
    startHttpServer();
    // initSocketIOServer(callbacks);
}

function allowCrossOrigin(req, res, next) {
    res.header('Access-Control-Allow-Origin', `localhost:${process.env.WEB_SERVER}`);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}

function startHttpServer() {
    app.use(allowCrossOrigin);
    let pathr = path.resolve('webGL');
    console.log(`dirname: ${__dirname}`);
    console.log(`join: ${path.join(__dirname, '../../webGL/public', 'favicon.ico')}`);
    console.log(`startHTTPSERVER: ${pathr}`);
    const myPath = path.resolve(__dirname+'../../../webGL/index.html');
    const staticPath = path.resolve(`${__dirname}../../../webGL`);
    console.log(`staticPath: ${staticPath}`);
    console.log(`myPath: ${myPath}`);
    app.use(favicon(path.join(__dirname, '../../webGL/public', 'favicon.ico')));
    app.use(express.static(staticPath));
    app.get('/', (req, res) => res.sendFile(myPath) );
    console.log(`Web server listening on port ${process.env.WEB_SERVER}`);
    http.listen(process.env.WEB_SERVER);
}

function initSocketIOServer(callbacks) {
    console.log(`initSocketIOServer: `);
    socketIO.on('connection', socket => {
        socketCount++;
        const key = socketCount;
        sockets[key] = socket;

        // callbacks.onWebpageReady();
        webpageReady = true;
        console.log("webpage ready");

        // socket.on( 'collision', callbacks.onCollision );
        socket.on( 'disconnect', () => { delete sockets[key]; webpageReady = false; console.log("webpage disconnected") } );
    })
}

function isWebpageRead() {
    return webpageReady;
}

module.exports = { WebpageServer, isWebpageRead };
