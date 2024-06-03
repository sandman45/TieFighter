import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Floor from "../../sceneSubjects/Floor.js";
import CollisionManager from "../../controls/CollisionManager.js";
import LaserCannons from "../../sceneSubjects/weapons/LaserCannons.js";
import PlayerControls from "../../controls/PlayerControls.js";
import Explosion from "../../particles/Explosion.js";
import GeneralLights from "../../sceneSubjects/GeneralLights.js";
import WeaponsCollisionManager from "../../controls/WeaponsCollisionManager.js";
import ModelLoader, { Model } from "../../utils/ModelLoader.js";
import FlyControls from "../../controls/FlyControls.js";

import {parseConfiguration} from "../../utils/SceneConfigUtils.js";
import globalConfiguration from "../../../sceneConfig.js";
import GameAudio from "../../utils/Audio.js";
import SkyBox from "../../sceneSubjects/SkyBox.js";
import Hud from "../../HUD/hud.js";

export default (canvas, canvas2, models, campaignConfiguration) => {
    console.log(`mission one width: ${canvas.width}, height: ${canvas.height}`);
    const sceneGlobalConstants = parseConfiguration(globalConfiguration);
    const scene = buildScene(sceneGlobalConstants);
    const renderer = buildRender(canvas);
    const targetRenderer = buildTargetRender(canvas2);
    const camera = buildCamera(canvas);
    const audio = GameAudio(camera, sceneGlobalConstants.audio, () => {
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
        if(ship.mesh.designation === campaignConfiguration.player.designation){
            playerShip = ship;
        }
    });

    const targetCamera = buildTargetCamera(canvas);

    const hud = new Hud(ships[2].mesh, targetCamera);

    let controls;
    if(sceneGlobalConstants.controls.flightControls){
        controls = createFlightControls(playerShip.mesh, camera, renderer, collisionManager, laser, audio, campaignConfiguration.player);
    } else {
        controls = PlayerControls(playerShip.mesh, laser, camera, campaignConfiguration.player, collisionManager, audio);
    }
    let sceneSubjects = [];

    const explosion = Explosion(scene, "EXPLOSION", audio, camera);



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

    const weaponsCollision = WeaponsCollisionManager([laser], null, scene, sceneGlobalConstants);

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
        SkyBox(scene, sceneGlobalConstants);
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
        const width = document.getElementById('radar').offsetWidth;
        const height = document.getElementById('radar').offsetHeight;
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

    return {
        scene,
        camera,
        targetCamera,
        renderer,
        targetRenderer,
        controls,
        sceneSubjects: sc,
        weaponsCollision
    };
}
