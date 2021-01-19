import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';
import FiniteStateMachine from "./FiniteStateMachine.js";

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
    let fsm;
    let loader;
    let mixer;
    let clip;
    let action;
    let modelReady = false;
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
    if(!modelConfiguration.playerName){
        initFiniteStateMachine();
    }
    scene.add(group);

    function addHistory() {
        const targetGO = globals.congaLine[targetNdx];
        const newTargetPos = new THREE.Vector3();
        newTargetPos.copy(targetGO.transform.position);
        targetHistory.push(newTargetPos);
    }

    function initFiniteStateMachine() {
        fsm = new FiniteStateMachine({
            patrol: {
                enter: () => {
                    console.log(`enter finite state machine`);
                    console.log(`start patrol`);
                },
                update: () => {
                    // console.log(`update patrol`);
                }
            },
            returnToBase: {},
            goToLast: {
                update: () => {
                    addHistory();

                    const targetPosition = targetHistory[0];
                    const maxVelocity = .5;
                    const turnSpeed = .5;
                    const distance = aimTowardAndGetDistance(transform, targetPosition, turnSpeed);
                    const velocity = distance;
                    transform.translateOnAxis(kForward, Math.min(velocity, maxVelocity));
                    if (distance <= maxVelocity) {
                        fsm.transition("follow");
                    }

                }
            },
            follow: {
                update: () => {
                    addHistory();
                    // remove the oldest history and just put ourselves there.
                    const targetPos = targetHistory.shift();
                    transform.position.copy(targetPos);
                    const deltaTurnSpeed = maxTurnSpeed * globals.deltaTime;
                    aimTowardAndGetDistance(transform, targetHistory[0], deltaTurnSpeed);
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
