import eventBus from '../eventBus/EventBus.js'
import eventType from "../eventBus/events.js"

export default (weapons, userId) => {
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

    function triggerEvent(sceneObjects, obj, event) {
        for(let i=0; i<sceneObjects.length; i++){
            if(event === eventType.EXPLOSION && sceneObjects[i].name === event){
                // new file that handles all this stuff?
                obj.mesh.hull = obj.mesh.hull - 25;
                // console.log(`Update ${obj.mesh.name} Hull: ${obj.mesh.hull}`);
                sceneObjects[i].trigger(obj.mesh.position);
                if(obj.mesh.hull <= 0){
                    console.log(`${obj.mesh.name} has been destroyed!`);
                    if(obj.mesh.userId === userId){
                        console.log(`I died as ${userId} ending game`);
                        eventBus.post(eventType.GAME_STATE_LOCAL_END, obj.mesh.userId);
                    }
                    eventBus.post(eventType.GAME_STATE, {
                        position: obj.mesh.position,
                        rotation: obj.mesh.rotation,
                        scale: obj.mesh.scale,
                        type: "DESTROYED",
                        userIdDestroyed: obj.mesh.userId,
                        userNameDestroyed: obj.mesh.name
                    });
                }
            }
        }
    }

    return {
        checkCollision
    }
}
