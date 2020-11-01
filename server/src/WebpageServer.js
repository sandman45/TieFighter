require('dotenv').config({ path: `${__dirname}/.env` });
const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const socketIO = require('socket.io')(http);
const favicon = require('serve-favicon');
const path = require('path');
const events = require('./events.js');

const sockets = {};
let socketCount = -1;

let gameState = {
    // room: {
    //     start: false,
    //     players: {}
    // }
};

let webpageReady = false;

function WebpageServer(callbacks) {
    startServer(callbacks);
}

function startServer(callbacks) {
    startHttpServer();
    initSocketIOServer(callbacks);
}

function allowCrossOrigin(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}

function startHttpServer() {
    app.use(allowCrossOrigin);
    console.log(`dirname: ${__dirname}`);
    const indexFile = path.resolve(__dirname+'../../../webGL/index.html');
    const staticPath = path.resolve(`${__dirname}../../../webGL`);
    console.log(`staticPath: ${staticPath}`);
    console.log(`indexFile: ${indexFile}`);
    app.use(favicon(path.join(__dirname, '../../webGL/public', 'favicon.ico')));
    app.use(express.static(staticPath));
    app.get('/', (req, res) => res.sendFile(indexFile) );
    console.log(`Web server listening on port ${process.env.WEB_SERVER}`);
    http.listen(process.env.WEB_SERVER);
}

function cleanUpUsersInRooms(id) {
    let ret = {
        disconnect: false,
    };
    const rooms = Object.keys(gameState);
    rooms.forEach(room => {
        if (gameState[room].players) {
            if(gameState[room].players[id]){
                const user = gameState[room].players[id];
                delete gameState[room].players[id];
                ret = {
                    room,
                    user,
                    disconnect: true
                };
            }
        }
    });
    return ret;
}

function checkPlayers(room){
    let player = "SPECTATOR";
    if(gameState[room]){
        const players = Object.keys(gameState[room].players);
        if(players.length === 0){
            player = "PLAYER1";
            return player;
        } else if(players.length > 1) {
            return player;
        } else {
            let pName = "PLAYER1";
            players.forEach(player => {
                pName = gameState[room].players[player].name;
            });
            if(pName === "PLAYER1"){
                player = "PLAYER2";
            } else if(pName === "PLAYER2"){
                player = "PLAYER1";
            }
            return player;
        }
    }
}

function initSocketIOServer(callbacks) {
    socketIO.on('connection', socket => {
        socketCount++;
        const key = socketCount;
        sockets[key] = socket;
        webpageReady = true;
        console.log("webpage ready");
        console.log(`socket id: ${sockets[key].id}`);

        socket.on( 'disconnect', () => {
            //check if they are in room
            const clean = cleanUpUsersInRooms(socket.id);
            if(clean.disconnect){
               // emite message to room they disconnected
                socket.to(clean.room).emit(events.UPDATES, {
                    message: `${clean.user.name}:${socket.id} has been disconnected from ${clean.room}`,
                    data: {}
                });
            }
            delete sockets[key];
            webpageReady = false;
            console.log("webpage disconnected");
            socketCount--;
            console.log(`socket count: ${socketCount}`);
        } );

        socket.on(events.JOIN_ROOM, data => {
            if(gameState[data.room] && Object.keys(gameState[data.room].players).length >= 4){
                // room is full
                socket.broadcast.to(socket.id).emit(events.UPDATES, {
                    message: `Room ${data} is full.`,
                    data: {}
                });
            } else {
                socket.join(data.room, () => {
                    if(!gameState[data.room]) {
                        gameState[data.room] = {
                            players: {},
                            start: false
                        };
                    }
                    const players = Object.keys(gameState[data.room].players);
                    if(checkPlayers(data.room) === "PLAYER1"){
                        gameState[data.room].players[socket.id] = {
                            id: socket.id,
                            name: "PLAYER1",
                            data: {}
                        };
                    } else if(checkPlayers(data.room) === "PLAYER2") {
                        gameState[data.room].players[socket.id] = {
                            id: socket.id,
                            name: "PLAYER2",
                            data: {}
                        };
                    } else {
                        gameState[data.room].players[socket.id] = {
                            id: socket.id,
                            name: `Spectator${players.length - 2}`,
                            data: {}
                        }
                    }
                    console.log(`${gameState[data.room].players[socket.id].name}:${socket.id} has joined room ${data.room}`);
                    socketIO.in(data.room).emit(events.UPDATES, {
                        message:`${gameState[data.room].players[socket.id].name}:${socket.id} has joined Room ${data.room}`,
                        data: gameState[data.room].players[socket.id]
                    });
                });
            }
        });

        socket.on(events.LEAVE_ROOM, data => {
            socket.leave(data.room, () => {
                console.log(`${gameState[data.room].players[socket.id].name}:${socket.id} has left room ${data.room}`);
                socket.to(data.room).emit(events.UPDATES, {
                     message: `${gameState[data.room].players[socket.id].name}:${socket.id} has left room`,
                     data: gameState[data.room].players[socket.id]
                });
                delete gameState[data.room].players[socket.id];
            });
        });

        socket.on(events.START_GAME, data => {
            const room = data.room;
            socketIO.of("/").in(room).clients((err, data) => {
               if(err){
                   console.log(err);
               }
               socketIO.in(room).emit(events.START_GAME, {
                   message: 'Starting Game!',
                   data: {
                       players: gameState[room].players
                   }
               });
            });
        });

        socket.on(events.GAME_STATE, data => {
            if(gameState[data.room] && gameState[data.room].players[socket.id]){
                // console.log(`user: ${gameState[data.room].players[socket.id].name}, data: ${JSON.stringify(data)}`);
                gameState[data.room].players[socket.id].type = data.type;
                gameState[data.room].players[socket.id].room = data.room;
                gameState[data.room].players[socket.id].userId = data.userId;
                gameState[data.room].players[socket.id].data = data.data;
                socket.to(data.room).emit(events.GAME_STATE, {
                    message: `${gameState[data.room].players[socket.id].name}:${socket.id} has updated position`,
                    data: gameState[data.room].players[socket.id]
                });
            }
        });
    });
}

function isWebpageReady() {
    return webpageReady;
}

module.exports = { WebpageServer, isWebpageReady };
