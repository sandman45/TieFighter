import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Floor from "../../sceneSubjects/Floor.js";
import CollisionManager from "../../controls/CollisionManager.js";
import LaserCannons from "../../sceneSubjects/weapons/LaserCannons.js";
import PlayerControls from "../../controls/PlayerControls.js";
import InspectionManager from "../../controls/InspectionManager.js";
import Explosion from "../../particles/Explosion.js";
import GeneralLights from "../../sceneSubjects/GeneralLights.js";
import WeaponsCollisionManager from "../../controls/WeaponsCollisionManager.js";
import ModelLoader, { Model } from "../../utils/ModelLoader.js";
import FlyControls from "../../controls/FlyControls.js";
import MissionObjectives from "./MissionObjectives.js";
import DockingManager from "../../controls/DockingManager.js";

import {parseConfiguration} from "../../utils/SceneConfigUtils.js";
import globalConfiguration from "../../../sceneConfig.js";
import GameAudio from "../../utils/Audio.js";
import SkyBox from "../../sceneSubjects/SkyBox.js";
import HUD, { initHUD } from "../../HUD/hud.js";
import SettingsStore from "../../settings/SettingsStore.js";

export default (canvas, canvas2, models, campaignConfiguration) => {
    let skyBox = null;
    console.log(`mission one width: ${canvas.width}, height: ${canvas.height}`);
    const sceneGlobalConstants = parseConfiguration(globalConfiguration);
    const scene = buildScene(sceneGlobalConstants);
    const renderer = buildRender(canvas);
    const targetRenderer = buildTargetRender(canvas2);
    const camera = buildCamera(canvas);
    const audio = GameAudio(camera, SettingsStore.getAudioConfig(), () => {
        audio.playSound("MUSIC", camera);
    });

    buildLight(scene);

    const floorConfig = sceneGlobalConstants.floor;
    const floor = Floor(scene, floorConfig);
    // static collision manager
    const collisionManager = CollisionManager([floor]);
    const laser = LaserCannons(scene, campaignConfiguration.weapons[0], collisionManager, audio);
    // Ships
    const ships = addShips(scene, models, campaignConfiguration, laser);
    const hudShips =[];
    ships.forEach((ship)=>{
        hudShips.push(ship.mesh);
    });

    let playerShip = {};
    ships.forEach(ship => {
        console.log(`ship: ${ship.mesh.name}`);
        if(ship.mesh.designation === campaignConfiguration.player.designation){
            playerShip = ship;
        }
        if(ship.mesh.name === 'SHUTTLE') {
            if(ship.mesh.dockTarget) {
                // starts docked in the ISD hangar — wings folded until it launches
                console.log(`shuttle starts docked, calling wingsUp`);
                ship.wingsUp();
            } else {
                console.log(`calling wingsDown on shuttle`);
                ship.wingsDown();
            }
        }
    });

    const targetCamera = buildTargetCamera(canvas);
    const hud = new HUD(null, targetCamera);

    // initHUD needs maxShields/maxHull so pass the full player config
    initHUD(campaignConfiguration.player);

    let controls;
    if(sceneGlobalConstants.controls.flightControls){
        controls = createFlightControls(playerShip.mesh, camera, renderer, collisionManager, laser, audio, campaignConfiguration.player);
    } else {
        controls = PlayerControls(playerShip.mesh, laser, camera, campaignConfiguration.player, collisionManager, audio);
    }
    let sceneSubjects = [];

    const inspectionManager = InspectionManager({ playerMesh: playerShip.mesh, hud });
    sceneSubjects.push(inspectionManager);

    const explosion = Explosion(scene, "EXPLOSION", audio, camera);

    if(campaignConfiguration.objectives) {
        MissionObjectives({
            config: campaignConfiguration.objectives,
            playerDesignation: campaignConfiguration.player.designation
        });

        const dockTarget = ships.find(ship => ship.mesh.designation === campaignConfiguration.objectives.dockDesignation);
        const dockingManager = DockingManager({
            playerMesh: playerShip.mesh,
            targetMesh: dockTarget && dockTarget.mesh,
            flyControls: controls
        });
        controls.dockingManager = dockingManager;
        sceneSubjects.push(dockingManager);
    }

    const sc = [
        GeneralLights(scene),
        floor,
        laser,
        controls,
        explosion,
        hud,
        ...ships,
        ...sceneSubjects
    ];

    const weaponsCollision = WeaponsCollisionManager([laser], playerShip.mesh.userId, scene, sceneGlobalConstants);

    function createFlightControls(mesh, camera, renderer, collisionManager, laser, audio, config) {
        const flightControls = new FlyControls( mesh, camera, renderer.domElement, collisionManager, laser, audio, config, hudShips, hud );
        flightControls.movementSpeed = config.speed;
        flightControls.domElement = renderer.domElement;
        flightControls.rollSpeed = config.rollSpeed;
        flightControls.autoForward = config.autoForward;
        flightControls.dragToLook = false;
        return flightControls;
    }

    function addShips(scene, models, campaignConfiguration, laser){
        const ships = [];
        Object.keys(models).forEach(model => {
            ships.push(ModelLoader(scene, models[model].config, Model[model], models[model].gltf, collisionManager, audio, laser));
        });
        return ships;
    }

    function buildScene(sceneGlobalConstants) {
        const scene = new THREE.Scene();
        skyBox = SkyBox(scene, sceneGlobalConstants);
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
        const light = new THREE.PointLight( 0xffffff, 10, 1200);
        light.add(new THREE.Mesh( sphere, new THREE.MeshBasicMaterial({color: 0xffffff})));
        light.position.set(400,400,500);
        scene.add(light);
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
        camera.layers.enable(1); // see SkyBox.js — main view renders the skybox, target computer doesn't

        return camera;
    }

    return {
        scene,
        camera,
        targetCamera,
        renderer,
        targetRenderer,
        controls,
        sceneSubjects: sc,
        weaponsCollision,
        updateSkyBox: (cam) => { if(skyBox) skyBox.update(cam); }
    };
}
