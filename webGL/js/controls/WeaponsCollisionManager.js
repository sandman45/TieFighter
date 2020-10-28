import eventType from "../eventBus/events.js"

export default (weapons) => {
    function checkCollision(sceneObjects) {
        for(let i=0; i<weapons.length; i++) {
            sceneObjects.forEach(obj => {
                // checkCollision with weapons with scene objects
                if(obj && obj.mesh){
                    // console.log(`checking mesh collision: ${obj.mesh.name}`);
                    const collisionCheck = weapons[i].checkCollision(obj.mesh);
                    if(collisionCheck.collision){
                        console.log(`lasers collided with ${obj.mesh.name}`);
                        console.log(`trigger: explosion at ${JSON.stringify(obj.mesh.position)}`);
                        // trigger explosion
                        triggerEvent(sceneObjects, obj.mesh.position, eventType.EXPLOSION);
                        return true;
                    }
                }
            });
        }
    }

    function triggerEvent(sceneObjects, position, event) {
        for(let i=0; i<sceneObjects.length; i++){
            if(event === eventType.EXPLOSION && sceneObjects[i].name === event){
                sceneObjects[i].trigger(position);
            }
        }
    }

    return {
        checkCollision
    }
}
