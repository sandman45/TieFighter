import eventBus from '../eventBus/EventBus.js'
import eventBusEvents from '../eventBus/events.js'

export default colliders => {
    function checkCollision(obj) {
        for(let i=0; i<colliders.length; i++) {
            const collisionCheck = colliders[i].checkCollision(obj);

            if(collisionCheck.collision) {
                // console.log(`Collision detected: ${obj.name} at ${JSON.stringify(obj.position)} with ${collisionCheck.name}`);
                eventBus.post(eventBusEvents.COLLISION, { target: collisionCheck.name, source: obj.name });
                return true;
            }
        }

        return false;
    }

	return {
        checkCollision
	}
}
