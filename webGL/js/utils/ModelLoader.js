import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

export const ModelType = {
    JSON: "JSON",
    OBJECT: "OBJECT",
    GLTF: "GLTF"
};

export const Model = {
    TIE_FIGHTER: "models/tie-fighter/tie.glb",
    TIE_BOMBER: "models/tie-bomber/tie-bomber.glb",
    TIE_INTERCEPTOR: "models/tie-interceptor/tie-interceptor.glb",
    TIE_ADVANCED: "models/tie-advanced/tie-advanced.glb",
    TIE_DEFENDER: "models/tie-defender/tie-defender.glb",
    SHUTTLE: "models/shuttle/shuttle.glb",
    ISD: "models/destroyer/isd.glb",
    A_WING: "models/a-wing.glb",
    B_WING: "models/b-wing.glb",
    X_WING: "models/x-wing.glb",
    Y_WING: "models/y-wing.glb"
};

export default (scene, modelConfiguration, modelType, model, position, modelGltf) => {
    const playerPosition = {
        x: position ? position.x : modelConfiguration.position.x,
        y: position ? position.y : modelConfiguration.position.y,
        z: position ? position.z : modelConfiguration.position.z,
    };
    console.log(`player POS: ${JSON.stringify(playerPosition)}`);
    let loader;
    let mixer;
    let clip;
    let clips;
    let action;
    let modelReady = false;
    const group = new THREE.Group();
    group.hull = modelConfiguration.hull;
    group.shields = modelConfiguration.shields;
    group.name = modelConfiguration.name;
    group.userId = modelConfiguration.userId;
    group.designation = modelConfiguration.designation;
    group.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    loadGLTFObject(modelGltf);
    scene.add(group);

    function loadGLTFObject(modelGltf) {
        const root = modelGltf.scene;
        root.rotation.y = modelConfiguration.rotation.y;
        root.scale.x = modelConfiguration.scale;
        root.scale.y = modelConfiguration.scale;
        root.scale.z = modelConfiguration.scale;
        root.name = modelConfiguration.name;

        if(modelGltf.animations.length > 0){
            mixer = new THREE.AnimationMixer(modelGltf.scene);
            const clips = modelGltf.animations;
            clip = THREE.AnimationClip.findByName( modelGltf.animations, 'Take 01' );
            action = mixer.clipAction( clip );
            action.play();
        }
        modelReady = true;
        group.add(root);
    }

    function update(time) {
        // const scale = (Math.sin(time)+4)/5;
        // const positionY = Math.sin(time)/2;
        if(modelReady && mixer){
            mixer.update(time);
            if(clips){
                playAnimations();
            }
        }

        // this makes the ship look like its floating
        // group.position.y = playerPosition.y + positionY;
    }

    function playAnimations() {
        // Play all animations
        clips.forEach( function ( clip ) {
            mixer.clipAction( clip ).play();
        } );
    }

    return {
        mesh: group,
        update
    }
}
