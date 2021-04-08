import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';
import FiniteStateMachine from "./FiniteStateMachine.js";
import NpcControls from "../controls/NpcControls.js";

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

export default (scene, modelConfiguration, model, modelGltf, collisionManager, audio, laser) => {
    let fsm;
    let loader;
    let mixer;
    let clip;
    let action;
    let cm;
    let modelReady = false;
    cm = collisionManager;
    const group = new THREE.Group();
    group.hull = modelConfiguration.hull;
    group.shields = modelConfiguration.shields;
    group.name = modelConfiguration.name;
    group.userId = modelConfiguration.userId ? modelConfiguration.userId : modelConfiguration.designation;
    group.designation = modelConfiguration.designation;
    group.faction = modelConfiguration.faction;
    group.position.set(modelConfiguration.position.x, modelConfiguration.position.y, modelConfiguration.position.z);

    if(modelGltf) {
        configureGLTFObject(modelGltf);

    } else {
        loadGLTFModel(Model[modelConfiguration.name]);
    }
    if(!modelConfiguration.playerName && collisionManager && audio && laser){
        initFiniteStateMachine(group);
    }
    scene.add(group);

    function initFiniteStateMachine(modelGroup) {
        fsm = new FiniteStateMachine({
            patrol: {
                enter: () => {
                    console.log(`start patrol`);
                },
                update: () => {
                    // moves forward then turns around 180 deg and fires weapons.. then repeats
                    const collision = NpcControls(scene, modelGroup, modelConfiguration,"patrol",-1, cm, audio, laser);
                    if(collision){
                        NpcControls(scene, modelGroup, modelConfiguration, "turnAround", 1, cm, audio, laser);
                        // console.log(`transition to patrol2`);
                        // fsm.transition("patrol2");
                        setTimeout(() => {
                            NpcControls(scene, modelGroup, modelConfiguration, "fire", null, cm, audio, laser);
                        }, 1000);
                    }
                }
            },
            patrol2: {
                enter: () => {
                    console.log(`start patrol2`);
                    // turn around 180 deg
                    console.log(`rotate ship`);
                    NpcControls(scene, modelGroup, modelConfiguration, "turnAround", 1, cm, audio);
                },
                update: () => {
                    const collision = NpcControls(scene, modelGroup, modelConfiguration, "patrol", -1, cm, audio, laser);
                    if(collision){
                        console.log(`transition to patrol`);
                        fsm.transition("patrol");
                    }
                }
            },
            acquireTarget: {
                enter: () => {
                    console.log(`start acquire target`);
                },
                update: () => {
                    console.log(`update acquire target`);
                }
            },
            returnToBase: {},
            goToLast: {
                update: () => {

                }
            },
            follow: {
                update: () => {

                },
            }
        }, "patrol");
    }

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
               animations(gltf);
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
            animations(modelGltf);
        }
        modelReady = true;
        group.add(root);
    }

    function animations(gltf) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        // clips = modelGltf.animations;
        clip = THREE.AnimationClip.findByName(gltf.animations, 'Take 01');
        action = mixer.clipAction(clip);
        // action.loop = THREE.LoopRepeat;
        action.clampWhenFinished = true;
        action.timeScale = 1/15;
        // action.play();
    }

    function update(time) {

        if(mixer && time && modelReady){
            mixer.update(250);
        }
        if(fsm) {
            fsm.update();
        }
        // this makes the ship look like its floating
        // const scale = (Math.sin(time)+4)/5;
        // const positionY = Math.sin(time)/2;
        // group.position.y = playerPosition.y + positionY;
    }

    function playAnimations() {
        if(mixer){
            modelReady = !modelReady;
            if(modelReady){
                action.play();
                action.paused = false;
            } else {
                action.paused = true;
            }
        }
    }

    return {
        mesh: group,
        update,
        playAnimations
    }
}
