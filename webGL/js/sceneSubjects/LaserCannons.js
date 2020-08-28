import * as THREE from '../../node_modules/three/build/three.module.js'

export default (scene, sourceShipPosition, destShipPosition) => {
    // const group = new THREE.Group();
    const geo = new THREE.PlaneBufferGeometry(1, 100);
    geo.rotateX( - Math.PI / 2);
    geo.translate( sourceShipPosition.x, sourceShipPosition.y, sourceShipPosition.z );
    // group.position.set(sourceShipPosition.x, sourceShipPosition.y, sourceShipPosition.z);

    const laser = new THREE.Object3D();
    laser.position.set(sourceShipPosition.x + 10, sourceShipPosition.y + 10, sourceShipPosition.z + 10);
    scene.add(laser);

    // scene.add(group);

    function checkCollision(position) {

    }

    return {
           checkCollision
    }
}
