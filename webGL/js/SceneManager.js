import * as THREE from '../node_modules/three/build/three.module.js';

import GeneralLights from './sceneSubjects/GeneralLights.js';
import Floor from './sceneSubjects/Floor.js';
import ModelLoader from './utils/ModelLoader.js';
import PlayerControls from './controls/PlayerControls.js';
import LaserCannons from './sceneSubjects/weapons/LaserCannons.js';
import WeaponsCollisionManager from './controls/WeaponsCollisionManager.js';
import CollisionManager from './controls/CollisionManager.js';
import GameAudio from './utils/Audio.js';

import SkyBox from "./sceneSubjects/SkyBox.js";
import sceneConfiguration from '../sceneConfig.js';

import { parseConfiguration, mapConfigurationToGUI } from './utils/SceneConfigUtils.js';
import dat from '../node_modules/dat.gui/build/dat.gui.module.js';
import { ModelType } from "./utils/ModelLoader.js";

export default canvas => {
    const clock = new THREE.Clock();
    let weaponsCollision;
    const screenDimensions = {
        width: canvas.width,
        height: canvas.height
    };

    const sceneConstants = parseConfiguration(sceneConfiguration);

    const scene = buildScene();
    const renderer = buildRender(screenDimensions);
    const camera = buildCamera(screenDimensions);
    const audio = new GameAudio(camera);

    const {sceneSubjects, controls} = createSceneSubjects(scene, sceneConstants, camera, audio);

    const datGui = new dat.GUI();

    mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);

    function buildScene() {
        const scene = new THREE.Scene();
        SkyBox(scene);
        // scene.background = new THREE.Color('#000');

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

    function buildCamera({ width, height }) {
        const aspectRatio = width / height;
        const fieldOfView = 60;
        const nearPlane = 1;
        const farPlane = 1000;
        const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

        camera.position.y = 10;

        return camera;
    }

    function createSceneSubjects(scene, sceneConstants, camera, audio) {
        const floorConfig = sceneConstants.floor;
        const playerConfig = sceneConstants.players[0];
        const npcConfig = sceneConstants.players[1];

        const floor = Floor(scene, floorConfig);
        const npc = ModelLoader(scene, npcConfig, ModelType.JSON);
        const player = ModelLoader(scene, playerConfig, ModelType.OBJECT);

        // static collision manager
        const collisionManager = CollisionManager([floor]);
        const laser = LaserCannons(scene, player.mesh.position, sceneConstants.weapons[0], collisionManager, audio);

        const controls = PlayerControls(player.mesh, laser, camera, playerConfig, collisionManager, audio);

        const sceneSubjects = [
            GeneralLights(scene),
            floor,
            laser,
            player,
            npc,
            controls,
        ];

        weaponsCollision = WeaponsCollisionManager([laser]);

        return { sceneSubjects, controls };
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
