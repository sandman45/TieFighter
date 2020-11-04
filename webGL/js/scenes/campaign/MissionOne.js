import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Floor from "../../sceneSubjects/Floor.js";
import CollisionManager from "../../controls/CollisionManager.js";
import LaserCannons from "../../sceneSubjects/weapons/LaserCannons.js";
import PlayerControls from "../../controls/PlayerControls.js";
import Explosion from "../../particles/Explosion.js";
import GeneralLights from "../../sceneSubjects/GeneralLights.js";
import WeaponsCollisionManager from "../../controls/WeaponsCollisionManager.js";
import ModelLoader, {Model, ModelType} from "../../utils/ModelLoader.js";
import FlyControls from "../../controls/FlyControls.js";
import {parseConfiguration} from "../../utils/SceneConfigUtils.js";
import sceneConfiguration from "../../../sceneConfig.js";
import GameAudio from "../../utils/Audio.js";
import SkyBox from "../../sceneSubjects/SkyBox.js";

export default (canvas, screenDimensions, models) => {
    const sceneConstants = parseConfiguration(sceneConfiguration);
    const scene = buildScene(sceneConstants);
    const renderer = buildRender(screenDimensions);
    const camera = buildCamera(screenDimensions);
    const audio = new GameAudio(camera, sceneConfiguration.audio);
    buildLight(scene);

    const floorConfig = sceneConstants.floor;
    const floor = Floor(scene, floorConfig);
    // static collision manager
    const collisionManager = CollisionManager([floor]);

    // Ships
    const ships = addShips(scene, models);
    let playerShip = {};
    ships.forEach(ship => {
        if(ship.mesh.designation === sceneConstants.campaign.missionOne.player.designation){
            playerShip = ship;
        }
    });

    const laser = LaserCannons(scene, sceneConstants.campaign.missionOne.weapons[0], collisionManager, audio);
    let controls;
    if(sceneConstants.controls.flightControls){
        controls = createFlightControls(playerShip.mesh, camera, renderer, collisionManager, laser, audio, sceneConstants.campaign.missionOne.player);
    } else {
        controls = PlayerControls(playerShip.mesh, laser, camera, sceneConstants.campaign.missionOne.player, collisionManager, audio);
    }
    let sceneSubjects = [];

    const explosion = Explosion(scene, "EXPLOSION", audio);

    const sc = [
        GeneralLights(scene),
        floor,
        laser,
        controls,
        explosion,
        ...ships,
        ...sceneSubjects
    ];

    const weaponsCollision = WeaponsCollisionManager([laser], null, scene, sceneConstants);

    function createFlightControls(mesh, camera, renderer, collisionManager, laser, audio, config) {
        const flightControls = new FlyControls( mesh, camera, renderer.domElement, collisionManager, laser, audio, config );
        flightControls.movementSpeed = config.speed;
        flightControls.domElement = renderer.domElement;
        flightControls.rollSpeed = config.rollSpeed;
        flightControls.autoForward = config.autoForward;
        flightControls.dragToLook = false;
        return flightControls;
    }

    function addShips(scene, models){
        const ships = [];
        Object.keys(models).forEach(model => {
            ships.push(ModelLoader(scene, models[model].config, ModelType.GLTF, Model[model], null, models[model].gltf));
        });
        return ships;
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

    return {
        scene,
        camera,
        renderer,
        controls,
        sceneSubjects: sc,
        weaponsCollision
    };
}
