import * as THREE from '../../node_modules/three/build/three.module.js';

export const ModelType = {
    JSON: "JSON",
    OBJECT: "OBJECT"
};

export default (scene, playerConfiguration, modelType) => {
    const playerPosition = { x: playerConfiguration.position.x, y: 6, z: 4 };
    let loader;
    const group = new THREE.Group();
    group.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    scene.add(group);

    if(modelType === ModelType.JSON) {
        loadModelJSON();
    } else if (modelType === ModelType.OBJECT) {
        loadModelObject();
    } else {
        // default to JSON
        loadModelJSON();
    }


    function loadModelObject() {
        loader = new THREE.ObjectLoader();
        loader.load('models/tie-fighter.json', function(obj) {
            obj.rotation.y = 3.15; // this is so the tie faces away
            obj.scale.x = playerConfiguration.scale;
            obj.scale.y = playerConfiguration.scale;
            obj.scale.z = playerConfiguration.scale;
            group.add(obj);
        })
    }

    function loadModelJSON() {
        loader = new THREE.JSONLoader();
        loader.load('models/spaceship.json', function(playerGeometry, playerMaterials) {
            for(let i = 0; i < playerMaterials.length; i++) {
                playerMaterials[i].flatShading = true;
                playerMaterials[i].shininess = 0;
                playerMaterials[i].metalness = 0;
                playerMaterials[i].roughness = 0.4;
            }

            const playerMesh = new THREE.Mesh(playerGeometry, playerMaterials);
            playerMesh.rotation.y = -Math.PI/2;
            playerMesh.castShadow = true;

            group.add(playerMesh);
        })
    }

    function update(time) {
        const scale = (Math.sin(time)+4)/5;
        const positionY = Math.sin(time)/2;

        group.position.y = playerPosition.y + positionY;
    }

    return {
        mesh: group,
        update
    }
}
