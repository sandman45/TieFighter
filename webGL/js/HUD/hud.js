import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

export default class HUD {
    constructor(target, camera){
        this.camera = camera;
        this.target = target;
        this.goal = new THREE.Object3D();
        target.add( this.goal );
        this.goal.position.set(0, 5, 20);
        this.setCameraPositionRelativeToMeshAndFollow(this.camera, target);
    }

    acquireNewTarget = (target) => {
        this.target = target;
        this.goal = new THREE.Object3D();
        target.add( this.goal );
        this.goal.position.set(0, 5, 20);
        this.setCameraPositionRelativeToMeshAndFollow(this.camera, target);
    };

    setCameraPositionRelativeToMeshAndFollow = (camera, mesh) => {
        const temp = new THREE.Vector3();
        temp.setFromMatrixPosition(this.goal.matrixWorld);
        camera.position.lerp(temp, .2);
        camera.lookAt( mesh.position );
    };

    update = () => {
      // update all hud items
        if(this.camera && this.target){
            this.setCameraPositionRelativeToMeshAndFollow(this.camera, this.target);
        }
    };

}
