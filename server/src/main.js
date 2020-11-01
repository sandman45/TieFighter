const events = require('./events.js');

require('dotenv').config({ path: `${__dirname}/.env` });

const { WebpageServer, isWebpageReady } = require('./WebpageServer');

// const TCPServer = require('./TCPServer');
// const portNumber = readPortNumberFromArguments();

// const webpageCallbacks = {
//     onDisconnect: objectName => server.disconnectClient( { type: events.DISCONNECT, arg: { objectName } } ),
//     onWebpageReady: objectName => server.connectClient( { type: events.WEB_PAGE_READY, arg: { objectName } } ),
//     onCollision: objectName => server.send( { type: events.COLLISION, arg: { objectName } } ),
//     playerAdded: objectName => server.send( { type: events.PLAYER_ADD, arg: { objectName } } )
// };

// const webpageServer = new WebpageServer(webpageCallbacks);
const webpageServer = new WebpageServer();
// const server = new TCPServer( {
//     port: portNumber,
//     onClientConnected: () => { if(isWebpageReady()) webpageCallbacks.onWebpageReady() },
//     onMessage: command => webpageServer[command.type](command.arg)
// } );
//
// function readPortNumberFromArguments() {
//     const port = Number(process.argv[2]) || process.env.PORT;
//     if(!port || port < 0 || port >= 65536) {
//         console.error("This script expects a valid port number (>= 0 and < 65536) as argument.");
//         process.exit()
//     }
//
//     return port;
// }
