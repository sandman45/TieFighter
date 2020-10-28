export function parseConfiguration(config) {
    const clone = JSON.parse(JSON.stringify(config));
    const { floor, players, sonars, movingObstacles, staticObstacles, weapons } = clone;

    checkConfigValidity(clone);

    players.forEach( player => {
        // player.position.x = ( player.position.x - 0.5 ) * floor.size.x;
        // player.position.y = ( player.position.y - 0.5 ) * floor.size.y;
        // player.position.z = player.position.z;
    });

    // sonars.forEach( sonar => {
    //     sonar.position.x = ( sonar.position.x - 0.5 ) * floor.size.x;
    //     sonar.position.y = ( sonar.position.y - 0.5 ) * floor.size.y;
    // });

    // weapons.forEach( weapon => {
    //    weapon.position.x = ( weapon.position.x - 0.5 ) * floor.size.x;
    //    weapon.position.y = ( weapon.position.y - 0.5 ) * floor.size.y;
    // });

    // movingObstacles.forEach( obstacle => {
    //     obstacle.position.x = ( obstacle.position.x - 0.5 ) * floor.size.x;
    //     obstacle.position.y = ( obstacle.position.y - 0.5 ) * floor.size.y;
    // });
    //
    // staticObstacles.forEach( obstacle => {
    //     obstacle.centerPosition.x = ( obstacle.centerPosition.x - 0.5 ) * floor.size.x;
    //     obstacle.centerPosition.y = ( obstacle.centerPosition.y - 0.5 ) * floor.size.y;
    //
    //     obstacle.size.x *= floor.size.x;
    //     obstacle.size.y *= floor.size.y;
    // });

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

            controller.onChange( value => {
                updateSceneConstants(sceneConstants, parseConfiguration(sceneConfiguration));
                // updates player position
                if(sceneConstants.controls.flightControls) {
                    // switch to flight controls

                } else {
                    // switch to other controls
                }
                controls.resetPosition();
                // TODO: need to update the other ships position
            })
        }
    }
}

function checkConfigValidity(config) {
    checkJsonStructure(config);
    const { floor, players, sonars, movingObstacles, staticObstacles, weapons } = config;

    players.forEach( checkPositionIsInRange );
    // sonars.forEach( checkPositionIsInRange );
    // movingObstacles.forEach( checkPositionIsInRange );
    // staticObstacles.forEach( checkStaticObstacle );

    function checkJsonStructure(config) {
        const { floor, players, sonars, movingObstacles, staticObstacles, weapons } = config;
        if(!floor)
            throw new Error('Config file malformed: floor not defined');
        if(!players)
            throw new Error('Config file malformed: player not defined');
        // if(!sonars)
        //     throw new Error('Config file malformed: sonars not defined');
        // if(!movingObstacles)
        //     throw new Error('Config file malformed: movingObstacles not defined');
        // if(!staticObstacles)
        //     throw new Error('Config file malformed: staticObstacles not defined');
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

    // function checkStaticObstacle(staticObstacle) {
    //     if(staticObstacle.centerPosition.x < 0 || staticObstacle.centerPosition.x > 1)
    //         throw new Error('Config file malformed: staticObstacle.centerPosition.x < 0 || staticObstacle.centerPosition.x > 1');
    //     if(staticObstacle.centerPosition.y < 0 || staticObstacle.centerPosition.y > 1)
    //         throw new Error('Config file malformed: staticObstacle.centerPosition.y < 0 || staticObstacle.centerPosition.y > 1');
    //
    //     if(staticObstacle.size.x < 0 || staticObstacle.size.x > 1)
    //         throw new Error('Config file malformed: staticObstacle.size.x < 0 || staticObstacle.size.x > 1');
    //     if(staticObstacle.size.y < 0 || staticObstacle.size.y > 1)
    //         throw new Error('Config file malformed: staticObstacle.size.y < 0 || staticObstacle.size.y > 1');
    // }
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

    // for(let i=0; i<sceneConstants.sonars.length; i++) {
    //     sceneConstants.sonars[i].position.x = sonars[i].position.x;
    //     sceneConstants.sonars[i].position.y = sonars[i].position.y;
    //     sceneConstants.sonars[i].senseAxis.x = sonars[i].senseAxis.x;
    //     sceneConstants.sonars[i].senseAxis.y = sonars[i].senseAxis.y;
    // }
    //
    // for(let i=0; i<sceneConstants.movingObstacles.length; i++) {
    //     sceneConstants.movingObstacles[i].position.x = movingObstacles[i].position.x;
    //     sceneConstants.movingObstacles[i].position.y = movingObstacles[i].position.y;
    //
    //     sceneConstants.movingObstacles[i].directionAxis.x = movingObstacles[i].directionAxis.x;
    //     sceneConstants.movingObstacles[i].directionAxis.y = movingObstacles[i].directionAxis.y;
    //     sceneConstants.movingObstacles[i].speed = movingObstacles[i].speed;
    //     sceneConstants.movingObstacles[i].range = movingObstacles[i].range;
    // }
    //
    // for(let i=0; i<sceneConstants.staticObstacles.length; i++) {
    //     sceneConstants.staticObstacles[i].centerPosition.x = staticObstacles[i].centerPosition.x;
    //     sceneConstants.staticObstacles[i].centerPosition.y = staticObstacles[i].centerPosition.y;
    //
    //     sceneConstants.staticObstacles[i].size.x = staticObstacles[i].size.x;
    //     sceneConstants.staticObstacles[i].size.y = staticObstacles[i].size.y;
    // }
}
