import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';

export const ModelType = {
    JSON: "JSON",
    OBJECT: "OBJECT",
    GLTF: "GLTF"
};

export const Model = {
    TIE: "models/tie-fighter/tie.glb",
    TIE_BOMBER: "models/tie-bomber/tie-bomber.glb",
    TIE_INTERCEPTOR: "models/tie-interceptor/tie-interceptor.glb",
    TIE_ADVANCED: "models/tie-advanced/tie-advanced.glb",
    TIE_DEFENDER: "models/tie-defender/tie-defender.glb",
    SHUTTLE: "models/shuttle/shuttle.glb",
    ISD: "models/destroyer/isd.glb"
};

export default (scene, playerConfiguration, modelType, model, position) => {
    const playerPosition = {
        x: position ? position.x : playerConfiguration.position.x,
        y: position ? position.y : playerConfiguration.position.y,
        z: position ? position.z : playerConfiguration.position.z,
    };
    console.log(`player POS: ${JSON.stringify(playerPosition)}`);
    let loader;
    const group = new THREE.Group();
    group.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    scene.add(group);

    loadGLTFObject(model);

    function loadGLTFObject(model) {
        loader = new GLTFLoader();
        loader.load(model, function(gltf, err) {
            if(err){
                console.log(`${JSON.stringify(err)}`);
            }
            const root = gltf.scene;
            root.rotation.y = playerConfiguration.rotation.y;
            root.scale.x = playerConfiguration.scale;
            root.scale.y = playerConfiguration.scale;
            root.scale.z = playerConfiguration.scale;
            group.name = playerConfiguration.name;
            group.add(root);
        });
    }

    function update(time) {
        const scale = (Math.sin(time)+4)/5;
        const positionY = Math.sin(time)/2;

        // this makes the ship look like its floating
        // group.position.y = playerPosition.y + positionY;
    }

    return {
        mesh: group,
        update
    }
}
