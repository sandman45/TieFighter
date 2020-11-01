// import * as THREE from '../node_modules/three/build/three.module.js';
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import GeneralLights from './sceneSubjects/GeneralLights.js';
import Floor from './sceneSubjects/Floor.js';
import ModelLoader from './utils/ModelLoader.js';
import PlayerControls from './controls/PlayerControls.js';
import FlyControls from './controls/FlyControls.js';

import Explosion from '../js/particles/Explosion.js';
import LaserCannons from './sceneSubjects/weapons/LaserCannons.js';
import WeaponsCollisionManager from './controls/WeaponsCollisionManager.js';
import CollisionManager from './controls/CollisionManager.js';
import GameAudio from './utils/Audio.js';

import eventBus from './eventBus/EventBus.js'
import eventBusEvents from './eventBus/events.js'

import SkyBox from "./sceneSubjects/SkyBox.js";
import sceneConfiguration from '../sceneConfig.js';

import { parseConfiguration, mapConfigurationToGUI } from './utils/SceneConfigUtils.js';
import dat from '../node_modules/dat.gui/build/dat.gui.module.js';
import { ModelType, Model } from "./utils/ModelLoader.js";

export default canvas => {
    const clock = new THREE.Clock();
    let weaponsCollision;
    const screenDimensions = {
        width: canvas.width,
        height: canvas.height
    };

    const sceneConstants = parseConfiguration(sceneConfiguration);

    const scene = buildScene(sceneConstants);
    const renderer = buildRender(screenDimensions);
    const camera = buildCamera(screenDimensions);
    const audio = new GameAudio(camera, sceneConfiguration.audio);
    buildLight(scene);
    let sceneSubjects = [];
    let controls;
    let sc;
    if( sceneConstants.multiPlayer.active ) {
        let userId;
        let player;
        let playerConfig;

        eventBus.subscribe(eventBusEvents.GAME_STATE_LOCAL_INIT, (data) => {
            console.log(data);

            // add yourself
            console.log(`adding you to game as ${data.name}: ${data.id}`);
            userId = data.id;
            const you = data.name;
            if(data.name === "PLAYER1"){
                playerConfig = sceneConstants.players[0];
            } else if (data.name === "PLAYER2") {
                playerConfig = sceneConstants.players[1];
            } else {
                // add spectator!
                // camera to control
            }
            player = ModelLoader(scene, {position: playerConfig.position, rotation: playerConfig.rotation, scale: playerConfig.scale, userId:data.id, name: playerConfig.playerName, hull: playerConfig.hull, shields: playerConfig.shields}, ModelType.GLTF, Model[playerConfig.name]);
            sc = createSceneMultiPlayerSubjects(scene, sceneConstants, camera, audio, player, playerConfig, userId);
            sceneSubjects = sc.sceneSubjects;
            controls = sc.controls;
            sceneSubjects.push(player);
        });

        eventBus.subscribe(eventBusEvents.GAME_STATE_LOCAL_INIT_OPPONENT, (data) => {
            // add opponent
            console.log(`adding opponent to game as ${data.name}: ${data.id}`);
            if(data.name === "PLAYER1"){
                playerConfig = sceneConstants.players[0];
            } else if (data.name === "PLAYER2") {
                playerConfig = sceneConstants.players[1];
            } else {
                // add spectator!
                // camera to control
            }
            player = ModelLoader(scene, {position: playerConfig.position, rotation: playerConfig.rotation, scale: playerConfig.scale, userId:data.id, name: playerConfig.playerName, hull: playerConfig.hull, shields: playerConfig.shields}, ModelType.GLTF, Model[playerConfig.name]);
            sceneSubjects.push(player);
        });

        eventBus.subscribe(eventBusEvents.GAME_STATE_LOCAL, (data) => {
            if(data.type === "LASERS"){
                // console.log(`${data.type}: ${JSON.stringify(data)}`);
                sceneSubjects.forEach(subject => {
                   if(subject.fire){
                       //grab mesh from player in scene
                       scene.children.forEach(child => {
                           if(child.userId === data.userId){
                               subject.fire(child, 2, child.name === "PLAYER2" ? "REBELLION" : "IMPERIAL");
                           }
                       });
                   }
                });
            } else if(data.type === "DESTROYED"){
                console.log(`${data.type}: ${JSON.stringify(data)}`);
                scene.children.forEach(child => {
                   if(child.userId === data.userId){
                       console.log(`removed ${child.name}: ${child.userId} `);
                       // remove from scene if its not already removed
                       if(child.userId === userId){
                           eventBus.post(eventBusEvents.GAME_STATE_LOCAL_END, data.userId);
                       } else {
                           scene.remove(child);
                       }
                   }
                });
            } else {
                // update scene with pertinent info
                let found = false;
                sceneSubjects.forEach(subject => {
                    if(subject.mesh && subject.mesh.userId === data.userId){
                        scene.children.forEach(child => {
                            if(child.userId === data.userId){
                                found = true;
                                // console.log(`update object in scene`);
                                child.position.set(data.data.position.x, data.data.position.y, data.data.position.z);
                                child.rotation.setFromVector3(new THREE.Vector3(data.data.rotation._x, data.data.rotation._y, data.data.rotation._z));
                                child.scale.set(data.data.scale.x, data.data.scale.y, data.data.scale.z);
                            }
                        });
                    }
                });
            }
        });

        eventBus.subscribe(eventBusEvents.GAME_STATE_LOCAL_END, (userId) => {
           // cleanup sceneObjects
           console.log(`${eventBusEvents.GAME_STATE_LOCAL_END} userId: ${userId}`);
           sceneSubjects.forEach((subject,i) => {
              if(subject.mesh) {
                  console.log(subject);
                  scene.remove(subject.mesh);
              }
           });
           sceneSubjects = [];
        });

    } else {
        const sc = createSceneSubjects(scene, sceneConstants, camera, audio);
        sceneSubjects = sc.sceneSubjects;
        controls = sc.controls;
    }

    const datGui = new dat.GUI();

    mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);

    function buildScene(sceneConstants) {
        const scene = new THREE.Scene();
        SkyBox(scene, sceneConstants);
        return scene;
    }

    function buildRender({ width, height }) {
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
        renderer.setPixelRatio(DPR);
        renderer.setSize(width, height);

        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        return renderer
    }

    function buildLight(scene){
        const sphere = new THREE.SphereBufferGeometry(16,32,32);
        const light = new THREE.PointLight( 0xffffff, 10, 700);
        light.add(new THREE.Mesh( sphere, new THREE.MeshBasicMaterial({color: 0xffffff})));
        light.position.set(400,400,500);
        scene.add(light);
    }

    function buildCamera({ width, height }) {
        const aspectRatio = width / height;
        const fieldOfView = 60;
        const nearPlane = 1;
        const farPlane = 3000;
        const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

        camera.position.y = 10;

        return camera;
    }

    function createFlightControls(mesh, camera, renderer, collisionManager, laser, audio, config) {
        const flightControls = new FlyControls( mesh, camera, renderer.domElement, collisionManager, laser, audio, config );
        flightControls.movementSpeed = config.speed;
        flightControls.domElement = renderer.domElement;
        flightControls.rollSpeed = config.rollSpeed;
        flightControls.autoForward = config.autoForward;
        flightControls.dragToLook = false;
        return flightControls;
    }

    function addRebelShips(scene, sceneConfig){
        const rebelShips = [];
        sceneConfig.rebels.forEach((config) => {
            rebelShips.push(ModelLoader(scene, config, ModelType.GLTF, Model[config.name]));
        });
        return rebelShips;
    }

    function addImperialShips(scene,sceneConfig){
        const imperialShips = [];
        sceneConfig.imperials.forEach((config) => {
            imperialShips.push(ModelLoader(scene, config, ModelType.GLTF, Model[config.name]));
        });
        return imperialShips;
    }

    function addPlayerShips(scene, sceneConfig){
        const playerShips = [];
        sceneConfig.players.forEach((config) => {
            playerShips.push(ModelLoader(scene, config, ModelType.GLTF, Model[config.name]));
        });
        return playerShips;
    }

    function createSceneMultiPlayerSubjects(scene, sceneConstants, camera, audio, player, playerConfig, userId) {
        const floorConfig = sceneConstants.floor;
        const floor = Floor(scene, floorConfig);

        // static collision manager
        const collisionManager = CollisionManager([floor]);
        const laser = LaserCannons(scene, player.mesh.position, sceneConstants.weapons[0], collisionManager, audio, playerConfig);
        let controls;
        if(sceneConstants.controls.flightControls){
            controls = createFlightControls(player.mesh, camera, renderer, collisionManager, laser, audio, playerConfig);
        } else {
            controls = PlayerControls(player.mesh, laser, camera, playerConfig, collisionManager, audio);
        }

        const explosion = Explosion(scene, "EXPLOSION", audio);

        const sceneSubjects = [
            GeneralLights(scene),
            floor,
            laser,
            controls,
            explosion,
        ];

        weaponsCollision = WeaponsCollisionManager([laser], userId);

        return {
            sceneSubjects,
            controls
        };
    }

    function createSceneSubjects(scene, sceneConstants, camera, audio) {
        const floorConfig = sceneConstants.floor;
        const floor = Floor(scene, floorConfig);
        const playerShips = addPlayerShips(scene,sceneConstants);
        const playerConfig = sceneConstants.players[0];
        // static collision manager
        const collisionManager = CollisionManager([floor]);
        const laser = LaserCannons(scene, playerShips[0].mesh.position, sceneConstants.weapons[0], collisionManager, audio);
        let controls;
        if(sceneConstants.controls.flightControls){
            controls = createFlightControls(playerShips[0].mesh, camera, renderer, collisionManager, laser, audio, playerConfig);
        } else {
            controls = PlayerControls(playerShips[0].mesh, laser, camera, playerConfig, collisionManager, audio);
        }

        const explosion = Explosion(scene, "EXPLOSION", audio);

        const rebels = addRebelShips(scene, sceneConstants);
        const imperials = addImperialShips(scene, sceneConstants);
        const sceneSubjects = [
            GeneralLights(scene),
            floor,
            laser,
            controls,
            explosion,
            ...playerShips,
            ...imperials,
            ...rebels
        ];

        weaponsCollision = WeaponsCollisionManager([laser]);

        return {
            sceneSubjects,
            controls
        };
    }

    function update() {
        const elapsedTime = clock.getElapsedTime();
        if(sceneSubjects.length > 0){
            if(weaponsCollision){
                weaponsCollision.checkCollision(sceneSubjects);
                for(let i = 0; i < sceneSubjects.length; i++) {
                    sceneSubjects[i].update(elapsedTime);



                }
            }
        }
        renderer.render(scene, camera);
    }

    function onWindowResize() {
        const { width, height } = canvas;

        screenDimensions.width = width;
        screenDimensions.height = height;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    function onKeyDown(keyCode, duration) {
        if(controls){
            controls.onKeyDown(keyCode, duration);
        }
    }

    function onKeyUp(keyCode) {
        if(controls){
            controls.onKeyUp(keyCode);
        }
    }

    return {
        update,
        onWindowResize,
        onKeyDown,
        onKeyUp
      }
}
