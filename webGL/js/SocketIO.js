import eventBus from './eventBus/EventBus.js';
import eventBusEvents from './eventBus/events.js';

const ObjectType = {
    LASER: "LASER",
    PLAYER: "PLAYER"
};

let userId = "tempId";
let room = "room";
export default () => {
    // subscribe to socket events
    const socket = io.connect("http://localhost:3000");

    socket.on( 'disconnect', () => {
        console.log("server disconnected")
    } );
    socket.on( 'connect', () => {
        console.log(`server connected ? ${socket.connected}, UserId: ${socket.id}`);
        userId = socket.id;
    });
    socket.on( eventBusEvents.GAME_STATE, (data) => {
        // console.log(`client: ${eventBusEvents.GAME_STATE} data: ${JSON.stringify(data)}`);
        // tell my client the info coming from server
        eventBus.post(eventBusEvents.GAME_STATE_LOCAL, data.data);
    });

    socket.on(eventBusEvents.UPDATES, (update) => {
        console.log(`You are: ${userId}`);
        console.log(`${eventBusEvents.UPDATES} ${JSON.stringify(update)}`);
    });

    socket.on(eventBusEvents.START_GAME, (update) => {
        console.log(`START GAME:  with users = ${JSON.stringify(update)}`);

        Object.keys(update.data.players).forEach(player => {
            // add opponents
            if(update.data.players[player].id !== userId) {
                console.log(`add ${update.data.players[player].name}:${update.data.players[player].id}`);
                eventBus.post(eventBusEvents.GAME_STATE_LOCAL_INIT_OPPONENT, update.data.players[player]);
            }
        });
    });

    socket.on(eventBusEvents.PLAYER_SELECTION_READY, (update) => {
        console.log(`${update.message}`);
        // add opponent

        // console.log(`add ${update.data.name}:${update.data.id} selection: ${update.data.selection}`);
        // eventBus.post(eventBusEvents.GAME_STATE_LOCAL_INIT_OPPONENT, update.data);
    });


    // SUBSCRIBE to client events
    eventBus.subscribe( eventBusEvents.GAME_STATE, (data) => {
        if(data.type === "LASERS"){
            // console.log(`${data.type}: ${JSON.stringify(data)}`);
        }

        if(data.type === "DESTROYED") {
            console.log('destroyed event emitting to all');
        }
        // send my info to server
        socket.emit(eventBusEvents.GAME_STATE, {
            room,
            userId: userId,
            type: data.type,
            data,
        });
    });

    eventBus.subscribe( eventBusEvents.COLLISION, objectName => {
        // console.log(`collision: ${JSON.stringify(objectName)}`);
        // if player hits object call stopMoving;
        if(objectName.source === ObjectType.PLAYER){
            // console.log(`SocketIO: collision - Stop Moving Player: ${JSON.stringify(objectName)}`);
            socket.emit(eventBusEvents.COLLISION, objectName); stopMoving();
        } else {
            // console.log(`SocketIO: collision: ${JSON.stringify(objectName)}`);
        }
    });

    eventBus.subscribe( eventBusEvents.LEAVE_ROOM, data => {
        console.log(`Socket Emit ${eventBusEvents.LEAVE_ROOM}`);
        eventBus.post(eventBusEvents.GAME_STATE_LOCAL_END, userId);
        socket.emit(eventBusEvents.LEAVE_ROOM, {
            room: data,
            userId: userId
        });
    });

    eventBus.subscribe( eventBusEvents.JOIN_ROOM, d => {
        console.log("Socket Emit JOIN_ROOM");
        room = d;
        socket.emit("JOIN_ROOM", {
            room: d,
            userId: userId
        });
    });

    eventBus.subscribe( eventBusEvents.PLAYER_SELECTION_READY, d => {
        // load yourself
        console.log(`add self: ${userId} to game: ${eventBusEvents.GAME_STATE_LOCAL}`);
        eventBus.post(eventBusEvents.GAME_STATE_LOCAL_INIT, {
            userId: userId,
            selection: d.selection
        });

        console.log("Socket Emit PLAYER SELECTION READY");
        socket.emit("PLAYER_SELECTION_READY", {
            room: d.room,
            selection: d.selection,
            userId: userId
        });
    });

    eventBus.subscribe( eventBusEvents.START_GAME, d => {
        console.log("Socket Emit START GAME");
        room = d;
        socket.emit("START_GAME", {
            room: d,
            userId: userId
        });
    });
}
