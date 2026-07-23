import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';
import createFighterFSM from "../ai/FighterFSM.js";
import createShuttleFSM from "../ai/ShuttleFSM.js";
import eventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";
import { resolveLaserRechargeRate, resolveShieldRechargeRate } from "./shipRechargeConfig.js";

export const Model = {
    TIE_FIGHTER: "models/tie-fighter/tie.glb",
    TIE_BOMBER: "models/tie-bomber/tie-bomber.glb",
    TIE_INTERCEPTOR: "models/tie-interceptor/tie-interceptor.glb",
    TIE_ADVANCED: "models/tie-advanced/tie-advanced.glb",
    TIE_DEFENDER: "models/tie-defender/tie-defender.glb",
    SHUTTLE: "models/shuttle/shuttle.glb",
    TRANSPORT: "models/transport/star_wars_gr-75_medium_transport.glb",
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
    let lastTime = 0;
    let skyBox = null;
    cm = collisionManager;
    const group = new THREE.Group();
    group.hull = modelConfiguration.hull;
    group.shields = modelConfiguration.shields;
    group.maxHull = modelConfiguration.hull;
    group.maxShields = modelConfiguration.shields;
    group.laserRechargeRate = resolveLaserRechargeRate(modelConfiguration);
    group.shieldRechargeRate = resolveShieldRechargeRate(modelConfiguration);
    group.name = modelConfiguration.name;
    group.userId = modelConfiguration.userId ? modelConfiguration.userId : modelConfiguration.designation;
    group.designation = modelConfiguration.designation;
    group.faction = modelConfiguration.faction;
    group.speed = modelConfiguration.speed;
    group.position.set(modelConfiguration.position.x, modelConfiguration.position.y, modelConfiguration.position.z);

    if(modelGltf) {
        configureGLTFObject(modelGltf);
    } else {
        loadGLTFModel(Model[modelConfiguration.name]);
    }

    if(!modelConfiguration.playerName && collisionManager && audio && laser
        && modelConfiguration.name !== 'ISD' && modelConfiguration.name !== 'TRANSPORT') {
        if(modelConfiguration.name === 'SHUTTLE') {
            fsm = createShuttleFSM({ scene, modelGroup: group, modelConfiguration, collisionManager: cm, audio, laser, wingsUp, wingsDown });
        } else {
            fsm = createFighterFSM({ scene, modelGroup: group, modelConfiguration, collisionManager: cm, audio, laser });
        }
    }
    scene.add(group);

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
        clip = THREE.AnimationClip.findByName(gltf.animations, 'Take 01');
        action = mixer.clipAction(clip);
        action.clampWhenFinished = true;
        action.timeScale = 1/15;
    }

    function wingsDown() {
        console.log(`wingsDown called`);
        if(!mixer || !action || !clip) return;
        action.stop();
        action.reset();
        action.timeScale = 1;
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.play();

        const halfTime = (clip.duration / 2) * 1000;
        setTimeout(() => {
            if(action) {
                action.paused = true;
                console.log(`wingsDown paused at halfway: ${action.time}`);
            }
        }, halfTime);
    }

    function wingsUp() {
        console.log(`wingsUp called`);
        if(!mixer || !action || !clip) return;
        action.stop();
        action.reset();
        action.timeScale = 1;
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.time = clip.duration / 2;
        action.play();

        const halfTime = (clip.duration / 2) * 1000;
        setTimeout(() => {
            if(action) {
                action.paused = true;
                console.log(`wingsUp paused at: ${action.time}`);
            }
        }, halfTime);
    }

    function update(time) {
        const delta = Math.max(0, time - lastTime);
        if(mixer && time && modelReady){
            mixer.update(delta);
        }
        lastTime = time;
        if(fsm) {
            fsm.update();
        }
        regenShields(delta);
    }

    // shields (not hull) trickle-recharge over time for ships that have any;
    // reuses the PLAYER_DAMAGED/TARGET_DAMAGED shapes the HUD already listens
    // to for damage, so no HUD changes are needed
    function regenShields(delta) {
        if(group.shieldRechargeRate <= 0 || group.hull <= 0 || group.shields >= group.maxShields) return;

        group.shields = Math.min(group.maxShields, group.shields + group.shieldRechargeRate * delta);

        const payload = {
            shields: group.shields,
            maxShields: group.maxShields,
            hull: group.hull,
            maxHull: group.maxHull,
        };
        if(modelConfiguration.playerName) {
            eventBus.post(events.PLAYER_DAMAGED, payload);
        } else {
            eventBus.post(events.TARGET_DAMAGED, {
                ...payload,
                userId: group.userId,
                designation: group.designation,
            });
        }
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
        playAnimations,
        wingsDown,
        wingsUp
    }
}
