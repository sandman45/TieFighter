
export default (weapons) => {
    function checkCollision(sceneObjects) {
        for(let i=0; i<weapons.length; i++) {
            sceneObjects.forEach(obj => {
                // checkCollision with weapons with scene objects
                if(obj.mesh){
                    // console.log(`checking mesh collision: ${obj.mesh.name}`);
                    const collisionCheck = weapons[i].checkCollision(obj.mesh);
                    if(collisionCheck.collision){
                        console.log(`lasers collided with ${obj.mesh.name}`);
                        console.log(`do something now.. `);
                        return true;
                    }
                }
            });
        }
    }

    return {
        checkCollision
    }
}
