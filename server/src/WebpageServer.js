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

function WebpageServer(callbacks) {
    startServer(callbacks);

    this.moveForward = duration => Object.keys(sockets).forEach( key => sockets[key].emit('moveForward', duration) );
    this.moveBackward = duration => Object.keys(sockets).forEach( key => sockets[key].emit('moveBackward', duration) );
    this.turnRight = duration => Object.keys(sockets).forEach( key => sockets[key].emit('turnRight', duration) );
    this.turnLeft = duration => Object.keys(sockets).forEach( key => sockets[key].emit('turnLeft', duration) );
    this.alarm = () => Object.keys(sockets).forEach( key => sockets[key].emit('alarm') );
}

function startServer(callbacks) {
    startHttpServer();
    initSocketIOServer(callbacks);
}

function allowCrossOrigin(req, res, next) {
    res.header('Access-Control-Allow-Origin', `localhost:${process.env.WEB_SERVER}`);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}

function startHttpServer() {
    app.use(allowCrossOrigin);
    const pathr = path.resolve('webGL');
    app.use(favicon(path.join(pathr, 'public', 'favicon.ico')));
    app.use(express.static('webGL'));
    app.get('/', (req, res) => res.sendFile('index.html', { root: `./webGL` }) );


    console.log(`Web server listening on port ${process.env.WEB_SERVER}`);
    http.listen(process.env.WEB_SERVER);
}

function initSocketIOServer(callbacks) {
    socketIO.on('connection', socket => {
        socketCount++;
        const key = socketCount;
        sockets[key] = socket;

        callbacks.onWebpageReady();
        webpageReady = true;
        console.log("webpage ready");

        socket.on( 'sonarActivated', callbacks.onSonarActivated );
        socket.on( 'collision', callbacks.onCollision );
        socket.on( 'disconnect', () => { delete sockets[key]; webpageReady = false; console.log("webpage disconnected") } );
    })
}

function isWebpageRead() {
    return webpageReady;
}

module.exports = { WebpageServer, isWebpageRead };
