import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";

export function parseConfiguration(config) {
    const clone = JSON.parse(JSON.stringify(config));
    const { floor, players, sonars, movingObstacles, staticObstacles, weapons } = clone;

    checkConfigValidity(clone);

    players.forEach( player => {
        // player.position.x = ( player.position.x - 0.5 ) * floor.size.x;
        // player.position.y = ( player.position.y - 0.5 ) * floor.size.y;
        // player.position.z = player.position.z;
    });

    return clone
}

export function mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, object, folder) {
    for(let key in object) {
        if(typeof object[key] === 'object') {
            const newFolder = folder ? folder.addFolder(key) : datGui.addFolder(key);

            mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, object[key], newFolder);
        } else {
            let scale;
            let controller;
            if(key === 'x' || key === 'z') {
                controller = folder ? folder.add( object, key, -100, 100 ) : datGui.add( object, key, -100, 100 );
            } else if (key === 'y') {
                controller = folder ? folder.add( object, key, -25, 25 ) : datGui.add( object, key, -25, 25 );
            } else {
                scale = ( ( key === 'x' || key === 'y' || key === 'z' ) && folder.parent.name !== 'floor' ) ? 100 : 100;
                controller = folder ? folder.add( object, key, 0, 1 *scale ) : datGui.add( object, key, 0, 1 *scale );
            }

            controller.onChange( (value) => {
                console.log(`controller onChange value: ${value}`);
                // sceneConstants are previous values and sceneConfiguration are the newly changed value
                updateSceneConstants(sceneConstants, parseConfiguration(sceneConfiguration));
                // updates player position
                // if(sceneConstants.controls.flightControls) {
                //     // switch to flight controls
                //
                // } else {
                //     // switch to other controls
                // }

                if(sceneConfiguration.multiPlayer.start){
                    EventBus.post(events.START_GAME, sceneConfiguration.multiPlayer.room);
                } else if (sceneConfiguration.multiPlayer.connect) {

                    let selection = null;
                    Object.keys(sceneConfiguration.multiPlayer.selection).forEach(ship => {
                        if(sceneConfiguration.multiPlayer.selection[ship]){
                            selection = ship;
                        }
                    });
                    if(selection){
                        EventBus.post(events.PLAYER_SELECTION_READY, {
                            selection,
                            room: sceneConfiguration.multiPlayer.room,
                        });
                    } else {
                        if(sceneConfiguration.multiPlayer.connect && !selection){
                            // connect to room
                            EventBus.post(events.JOIN_ROOM, sceneConfiguration.multiPlayer.room);
                        } else if (!sceneConfiguration.multiPlayer.connect){
                            EventBus.post(events.LEAVE_ROOM, sceneConfiguration.multiPlayer.room);
                        }
                    }
                }

                // if(controls) {
                //     controls.resetPosition();
                // }
            });
        }
    }
}

function checkConfigValidity(config) {
    checkJsonStructure(config);
    const { floor, players, weapons } = config;

    players.forEach( checkPositionIsInRange );

    function checkJsonStructure(config) {
        const { floor, players, sonars, movingObstacles, staticObstacles, weapons } = config;
        if(!floor)
            throw new Error('Config file malformed: floor not defined');
        if(!players)
            throw new Error('Config file malformed: player not defined');
        if(!weapons)
            throw new Error('Config file malformed: weapons not defined');
    }

    function checkPositionIsInRange(obj) {
        if(obj.position.x < -100 || obj.position.x > 100)
            throw new Error('Config file malformed: position.x < -100 || position.x > 100');
        if(obj.position.y < -100 || obj.position.y > 100)
            throw new Error('Config file malformed: position.y < -25 || position.y > 25');
        if(obj.position.z < -100 || obj.position.z > 100)
            throw new Error('Config file malformed: position.z < -100 || position.z > 100');
    }
}

function updateSceneConstants(sceneConstants, newSceneConstants) {
    const { floor, players, sonars, movingObstacles, staticObstacles } = newSceneConstants;

    sceneConstants.floor.size.x = floor.size.x;
    sceneConstants.floor.size.y = floor.size.y;

    for(let i=0; i<sceneConstants.players.length; i++) {
        sceneConstants.players[i].position.x = players[i].position.x;
        sceneConstants.players[i].position.y = players[i].position.y;
        sceneConstants.players[i].position.z = players[i].position.z;
        sceneConstants.players[i].speed = players[i].speed;
        sceneConstants.players[i].scale = players[i].scale;
    }
}
