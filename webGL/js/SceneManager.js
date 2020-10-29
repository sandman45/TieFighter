// import * as THREE from '../node_modules/three/build/three.module.js';
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import GeneralLights from './sceneSubjects/GeneralLights.js';
import Floor from './sceneSubjects/Floor.js';
import ModelLoader from './utils/ModelLoader.js';
import PlayerControls from './controls/PlayerControls.js';
import FlyControls from './controls/FlyControls.js';

import Explosion from '../js/particles/explosion.js';
import LaserCannons from './sceneSubjects/weapons/LaserCannons.js';
import WeaponsCollisionManager from './controls/WeaponsCollisionManager.js';
import CollisionManager from './controls/CollisionManager.js';
import GameAudio from './utils/Audio.js';

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
    const {sceneSubjects, controls} = createSceneSubjects(scene, sceneConstants, camera, audio);

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
        weaponsCollision.checkCollision(sceneSubjects);
        for(let i = 0; i < sceneSubjects.length; i++) {
            sceneSubjects[i].update(elapsedTime);
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
        controls.onKeyDown(keyCode, duration);
    }

    function onKeyUp(keyCode) {
        controls.onKeyUp(keyCode);
    }

    return {
        update,
        onWindowResize,
        onKeyDown,
        onKeyUp
      }
}
