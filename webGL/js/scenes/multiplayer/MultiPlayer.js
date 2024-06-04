import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Floor from "../../sceneSubjects/Floor.js";
import GeneralLights from "../../sceneSubjects/GeneralLights.js";
import {parseConfiguration} from "../../utils/SceneConfigUtils.js";
import sceneConfiguration from "../../../sceneConfig.js";
import GameAudio from "../../utils/Audio.js";
import SkyBox from "../../sceneSubjects/SkyBox.js";
import eventBus from "../../eventBus/EventBus.js";
import eventBusEvents from "../../eventBus/events.js";
import ModelLoader, { Model } from "../../utils/ModelLoader.js";
import CollisionManager from "../../controls/CollisionManager.js";
import LaserCannons from "../../sceneSubjects/weapons/LaserCannons.js";
import PlayerControls from "../../controls/PlayerControls.js";
import Explosion from "../../particles/Explosion.js";
import WeaponsCollisionManager from "../../controls/WeaponsCollisionManager.js";
import FlyControls from "../../controls/FlyControls.js";
import Hud from "../../HUD/hud.js";
import LocalStorage from "../../localStorage/localStorage.js"

export default (canvas, canvas2, sceneSubjects) => {
    const sceneConstants = parseConfiguration(sceneConfiguration);
    const scene = buildScene(sceneConstants);
    const renderer = buildRender(canvas);
    const targetRenderer = buildTargetRender(canvas2);
    const camera = buildCamera(canvas);
    let targetCamera;
    const audio = GameAudio(camera, sceneConfiguration.audio, () => {
        audio.playSound("MUSIC", camera);
    });
    let userId = null;
    let player = null;
    let playerConfig = null;
    let laser = null;
    let weaponsCollision = null;
    let controls = null;
    let hud = null;
    let hudShips = [];
    buildLight(scene);

    const floorConfig = sceneConstants.floor;
    const floor = Floor(scene, floorConfig);

    sceneSubjects.push(GeneralLights(scene));
    sceneSubjects.push(floor);

    const collisionManager = CollisionManager([floor]);
    laser = LaserCannons(scene, sceneConstants.multiPlayer.weapons[0], collisionManager, audio);

    const explosion = Explosion(scene, "EXPLOSION", audio, camera);

    sceneSubjects.push(explosion);

    const loadingElem = document.querySelector('#loading');
    loadingElem.style.display = 'none';

    const selection = LocalStorage.getItem("SELECTED_SHIP");
    const room = LocalStorage.getItem("SOCKET_ROOM");

    initPlayer();

    eventBus.post(eventBusEvents.PLAYER_SELECTION_READY, {
        selection,
        room: room,
    });

    function initPlayer(){
        console.log(`MULTI PLAYER: ${eventBusEvents.GAME_STATE_LOCAL_INIT}`);
        const selectedShip = LocalStorage.getItem("SELECTED_SHIP");
        const socketId = LocalStorage.getItem("SOCKET_ID");
        console.log(`selectedShip: ${selectedShip}`);
        console.log(`socketId: ${socketId}`);
        userId = socketId;
        let selection = null;
        const models = sceneConstants.multiPlayer.imperials.concat(sceneConstants.multiPlayer.rebels);
        models.forEach(model => {
            if(model.name === selectedShip) {
                selection = model;
            }
        });
        console.log(`adding you to game as ${selectedShip}: userId: ${userId}`);

        playerConfig = selection;
        playerConfig.userId = socketId;
        player = ModelLoader(scene, playerConfig, Model[playerConfig.name], null);

        targetCamera = buildTargetCamera(canvas);

        sceneSubjects.push(player);
        hudShips.push(player.mesh);
        hud = new Hud(hudShips[0], targetCamera);
        sceneSubjects.push(hud);
        if(sceneConstants.controls.flightControls){
            controls = createFlightControls(player.mesh, camera, renderer, collisionManager, laser, audio, playerConfig);
        } else {
            controls = PlayerControls(player.mesh, laser, camera, playerConfig, collisionManager, audio);
        }
        controls.dragToLook = false;
        weaponsCollision = WeaponsCollisionManager([laser], userId, scene, sceneConstants);
        
        sceneSubjects.push(controls);
        sceneSubjects.push(laser);
    }

    eventBus.subscribe(eventBusEvents.GAME_STATE_LOCAL_INIT_OPPONENT, (data) => {
        let add = true;
        // check and make sure he isnt already added
        let selection = null;
        const models = sceneConstants.multiPlayer.imperials.concat(sceneConstants.multiPlayer.rebels);
        models.forEach(model => {
            if(model.name === data.selection) {
                selection = model;
            }
        });

        console.log(`adding opponent to game as ${selection.name}: userId: ${data.userId}: id: ${data.id}`);
        const opponentConfig = selection;
        opponentConfig.userId = data.id;

        sceneSubjects.forEach(sub => {
            if(sub.mesh && sub.mesh.userId === data.userId){
                console.log(`Opponent ${data.userId} : ${data.id} is already in the game as ${selection.name} skipping adding opponent`);
                add = false;
            }
        });
        if(add){
            const opponent = ModelLoader(scene, opponentConfig, Model[opponentConfig.name], null);
            hudShips.push(opponent.mesh);
            sceneSubjects.push(opponent);
        }
    });

    eventBus.subscribe(eventBusEvents.GAME_STATE_LOCAL, (data) => {
        if(data.type === "LASERS"){
            // console.log(`${data.type}: ${JSON.stringify(data)}`);
            sceneSubjects.forEach(subject => {
                if(subject.fire){
                    //grab mesh from player in scene
                    scene.children.forEach(child => {
                        if(child.userId === data.userId){
                            subject.fire(child, 2, child.faction);
                        }
                    });
                }
            });
        } else if(data.type === "DESTROYED"){
            //
            console.log(`${data.type}: ${JSON.stringify(data.data)}`);
            console.log(`${data.data.userNameDestroyed}: userId ${data.data.userIdDestroyed} has been destroyed!`);
            if(data.data.userIdDestroyed === userId) {
                console.log(`Oh shit that was me!! I am dead!`);
                eventBus.post(eventBusEvents.GAME_STATE_LOCAL_END, data.data.userIdDestroyed);
            }
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

    eventBus.subscribe(eventBusEvents.GAME_STATE_OPPONENT_LEFT_GAME, data => {
       console.log(`Opponent left.. cleaning up their mess`);
        scene.children.forEach(child => {
            if(child.userId === data.userId){
                console.log(`${child.name}: ${data.userId} userId has been removed from game!`);
                scene.remove(child);
                sceneSubjects.splice(sceneSubjects.indexOf(child), 1);
                hudShips.splice(sceneSubjects.indexOf(child),1);
            }
        });
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

    function getControls(){
        return controls;
    }

    function getWeaponsCollision() {
        return weaponsCollision;
    }

    function getSceneSubjects() {
        return sceneSubjects;
    }

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

    function buildTargetRender({ width, height }) {
        const targRenderer = new THREE.WebGLRenderer({ canvas: canvas2, antialias: true, alpha: true });
        const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
        targRenderer.setPixelRatio(DPR);
        targRenderer.setSize(width, height);

        targRenderer.gammaInput = true;
        targRenderer.gammaOutput = true;

        targRenderer.shadowMap.enabled = true;
        targRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

        return targRenderer
    }
    function buildLight(scene){
        const sphere = new THREE.SphereBufferGeometry(16,32,32);
        const light = new THREE.PointLight( 0xffffff, 10, 700);
        light.add(new THREE.Mesh( sphere, new THREE.MeshBasicMaterial({color: 0xffffff})));
        light.position.set(400,400,500);
        scene.add(light);
    }

    // target Camera
    function buildTargetCamera() {
        const width = document.getElementById('targetComputer').offsetWidth;
        const height = document.getElementById('targetComputer').offsetHeight;
        const aspectRatio = width / height;
        const fieldOfView = 60;
        const nearPlane = 1;
        const farPlane = 3000;
        const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

        camera.position.y = 10;

        return camera;
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
        const flightControls = new FlyControls( mesh, camera, renderer.domElement, collisionManager, laser, audio, config, hudShips, hud );
        flightControls.movementSpeed = config.speed;
        flightControls.domElement = renderer.domElement;
        flightControls.rollSpeed = config.rollSpeed;
        flightControls.autoForward = config.autoForward;
        flightControls.dragToLook = false;
        return flightControls;
    }

    return {
        scene,
        camera,
        targetCamera,
        renderer,
        targetRenderer,
        getControls,
        getSceneSubjects,
        getWeaponsCollision
    };
}

