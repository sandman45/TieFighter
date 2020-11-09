import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';

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

export default (scene, modelConfiguration, model, modelGltf) => {
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
    group.position.set(modelConfiguration.position.x, modelConfiguration.position.y, modelConfiguration.position.z);

    if(modelGltf) {
        configureGLTFObject(modelGltf);

    } else {
        loadGLTFModel(Model[modelConfiguration.name]);
    }
    scene.add(group);

    /**
     * loadGLTFModel
     * @description this will load the GLTF model
     * from file and sets it up
     * @param modelGltf
     */
    function loadGLTFModel(modelGltf) {
        loader = new GLTFLoader();
        loader.load(modelGltf, function(gltf, err) {
            if(err){
                console.log(`${JSON.stringify(err)}`);
            }
            const root = gltf.scene;
            root.rotation.y = modelConfiguration.rotation.y;
            root.scale.x = modelConfiguration.scale;
            root.scale.y = modelConfiguration.scale;
            root.scale.z = modelConfiguration.scale;
            root.name = modelConfiguration.name;
            if(gltf.animations.length > 0){
                mixer = new THREE.AnimationMixer(gltf.scene);
                const clips = gltf.animations;
                clip = THREE.AnimationClip.findByName( gltf.animations, 'Take 01' );
                action = mixer.clipAction( clip );
                action.play();
            }
            modelReady = true;
            group.add(root);
        });
    }

    /**
     * configureGLTFObject
     * @description this takes a gltf model already loaded
     * by the manager and configures it before adding it to the group which
     * has already been added to the scene
     * @param modelGltf
     */
    function configureGLTFObject(modelGltf) {
        const root = modelGltf.scene;
        root.rotation.y = modelConfiguration.rotation.y;
        root.scale.x = modelConfiguration.scale;
        root.scale.y = modelConfiguration.scale;
        root.scale.z = modelConfiguration.scale;
        root.name = modelConfiguration.name;

        if (modelGltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(modelGltf.scene);
            const clips = modelGltf.animations;
            clip = THREE.AnimationClip.findByName(modelGltf.animations, 'Take 01');
            action = mixer.clipAction(clip);
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
