import eventBus from '../eventBus/EventBus.js'
import eventType from "../eventBus/events.js"

export default (weapons, userId, scene, sceneConstants) => {
    function checkCollision(sceneObjects) {
        for(let i=0; i<weapons.length; i++) {
            sceneObjects.forEach(obj => {
                // checkCollision with weapons with scene objects
                if(obj && obj.mesh){
                    // console.log(`checking mesh collision: ${obj.mesh.name}`);
                    const collisionCheck = weapons[i].checkCollision(obj.mesh);
                    if(collisionCheck.collision){
                        // console.log(`lasers collided with ${obj.mesh.name}`);
                        // console.log(`trigger: explosion at ${JSON.stringify(obj.mesh.position)}`);
                        // trigger explosion
                        triggerEvent(sceneObjects, obj, eventType.EXPLOSION);
                        return true;
                    }
                }
            });
        }
    }

    function applyDamage(mesh, amount) {
        if(mesh.shields > 0) {
            const shieldDamage = Math.min(mesh.shields, amount);
            mesh.shields -= shieldDamage;
            const remainder = amount - shieldDamage;
            if(remainder > 0) {
                mesh.hull -= remainder;
            }
        } else {
            mesh.hull -= amount;
        }
        mesh.hull = Math.max(0, mesh.hull);
        mesh.shields = Math.max(0, mesh.shields);
    }

    function triggerEvent(sceneObjects, obj, event) {
        for(let i=0; i<sceneObjects.length; i++){
            if(event === eventType.EXPLOSION && sceneObjects[i].name === event){
                const isPlayer = obj.mesh.userId === userId;

                applyDamage(obj.mesh, 25);

                // if this is the player's ship, broadcast for the HUD
                if(isPlayer) {
                    eventBus.post(eventType.PLAYER_DAMAGED, {
                        shields: obj.mesh.shields,
                        maxShields: obj.mesh.maxShields,
                        hull: obj.mesh.hull,
                        maxHull: obj.mesh.maxHull,
                    });
                }

                sceneObjects[i].trigger(obj.mesh.position);
                // console.log(`Update ${obj.mesh.name} Hull: ${obj.mesh.hull}`);

                if(obj.mesh.hull <= 0){
                    if(sceneConstants.multiPlayer.active){
                        console.log(`${obj.mesh.name}: ${obj.mesh.userId} has been destroyed!`);
                        if(obj.mesh.userId === userId){
                            console.log(`I died as ${userId} ending game`);
                            eventBus.post(eventType.GAME_STATE_LOCAL_END, obj.mesh.userId);
                        } else {
                            // remove mesh from game
                            // search through scene to make sure we kill the right one and remove the group too
                            scene.children.forEach(child => {
                                if(child.userId === obj.mesh.userId){
                                    console.log(`${child.name}: ${obj.mesh.userId} userId has been destroyed!`);
                                    scene.remove(child);
                                    sceneObjects.splice(sceneObjects.indexOf(obj), 1);
                                }
                            });
                        }
                        eventBus.post(eventType.GAME_STATE, {
                            position: obj.mesh.position,
                            rotation: obj.mesh.rotation,
                            scale: obj.mesh.scale,
                            type: "DESTROYED",
                            userIdDestroyed: obj.mesh.userId,
                            userNameDestroyed: obj.mesh.name
                        });
                    } else {
                        // remove mesh from game
                        // search through scene to make sure we kill the right one and remove the group too
                        scene.children.forEach(child => {
                            if(child.userId === obj.mesh.userId){
                               console.log(`${child.name}: ${child.userId} has been destroyed!`);
                               scene.remove(child);
                               sceneObjects.splice(sceneObjects.indexOf(obj), 1);
                            }
                        });
                    }
                }
            }
        }
    }

    return {
        checkCollision
    }
}
