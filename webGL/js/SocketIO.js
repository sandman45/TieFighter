import eventBus from './eventBus/EventBus.js';
import eventBusEvents from './eventBus/events.js';

const ObjectType = {
    LASER: "LASER",
    PLAYER: "PLAYER"
};

export default (onKeyUp, onKeyDown) => {
    const socket = io();

    socket.on( 'moveForward', duration => moveForward(duration) );
    socket.on( 'moveBackward', duration => moveBackward(duration) );
    socket.on( 'turnRight', duration => turnRight(duration) );
    socket.on( 'turnLeft', duration => turnLeft(duration) );
    socket.on( 'fireCannons', duration => fire(duration));
    socket.on( 'alarm', stopMoving );

    socket.on( 'disconnect', () => console.log("server disconnected") );

    eventBus.subscribe( eventBusEvents.sonarActivated, sonarId => socket.emit('sonarActivated', sonarId));
    eventBus.subscribe( eventBusEvents.collision, objectName => {
        console.log(`collision: ${JSON.stringify(objectName)}`);
        // if player hits object call stopMoving;
        if(objectName.source === ObjectType.PLAYER){
            console.log(`SocketIO: collision - Stop Moving Player: ${JSON.stringify(objectName)}`);
            socket.emit('collision', objectName); stopMoving();
        } else {
            console.log(`SocketIO: collision: ${JSON.stringify(objectName)}`);
        }
    });

    const keycodes = {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        R: 82,
        F: 70,
        Q: 81,
        E: 69,
        V: 86,
        B: 66,
        SPACE: 32
    };

    let moveForwardTimeoutId;
    let moveBackwardTimeoutId;

    function moveForward(duration) {
        clearTimeout(moveForwardTimeoutId);
        onKeyDown( { keyCode: keycodes.W } );
        if(duration >= 0) moveForwardTimeoutId = setTimeout( () => onKeyUp( { keyCode: keycodes.W } ), duration );
    }

    function moveBackward(duration) {
        clearTimeout(moveBackwardTimeoutId);
        onKeyDown( { keyCode: keycodes.S } );
        if(duration >= 0) moveBackwardTimeoutId = setTimeout( () => onKeyUp( { keyCode: keycodes.S } ), duration );
    }

    function turnRight(duration) {
        onKeyDown( { keyCode: keycodes.R }, duration );
    }

    function turnLeft(duration) {
        onKeyDown( { keyCode: keycodes.F }, duration );
    }

    function stopMoving() {
        onKeyUp( { keyCode: keycodes.W } );
        onKeyUp( { keyCode: keycodes.S } );
    }

    function fire() {
        onKeyDown( { keyCode: keycodes.SPACE }, duration );
    }
}
