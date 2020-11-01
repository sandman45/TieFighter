const events = require('./events.js');
const net = require('net');

const SEPARATOR = ';';
const connectedClients = {};

function TCPServer( { port, onClientConnected, onMessage } ) {
    start(port);

    this.send = function(object) {
        for(let key in connectedClients){
            console.log(`send: ${object.type}, client: ${connectedClients[key].id}`);
            connectedClients[key].write(SEPARATOR +JSON.stringify(object) +SEPARATOR +"\n")
        }
    };

    this.connectClient = function (object) {
        connectedClients[object.arg.objectName.client.id] = object.arg.objectName.client;
        console.log(`TCP Connected: ${object.arg.objectName.client.id}`);
    };

    this.disconnectClient = function (object) {
      delete connectedClients[object.arg.objectName.client.id];
      console.log(`TCP: Disconnected ${object.arg.objectName.client.id}`);
    };

    function start(port) {
        const server = net.createServer( socket => {
            const clientId = `${socket.remoteAddress}`;
            connectedClients[clientId] = socket;

            console.log(`\n[${ clientId }] connected`);

            onClientConnected();

            socket.on('data', message => {
                String(message)
                     .split(SEPARATOR)
                     .map( string => string.trim() )
                     .filter( string => string.length !== 0  )
                     .map( JSON.parse )
                     .forEach( onMessage )
            });

            socket.on('end', () => {
                console.log(`[${ clientId }] connection terminated`);
                delete connectedClients[clientId]
            });

            socket.on('error', () => {
                console.log(`[${ clientId }] connection error`);
                delete connectedClients[clientId]
            })
        });

        server.listen(port);

        console.log(`TCP server listening on port ${port}`);
    }
}

module.exports = TCPServer;
