import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Floor from "../../sceneSubjects/Floor.js";
import GeneralLights from "../../sceneSubjects/GeneralLights.js";
import {parseConfiguration} from "../../utils/SceneConfigUtils.js";
import sceneConfiguration from "../../../sceneConfig.js";
import GameAudio from "../../utils/Audio.js";
import SkyBox from "../../sceneSubjects/SkyBox.js";
import ModelLoader, {Model, ModelType} from "../../utils/ModelLoader.js";

export default (canvas, screenDimensions, models) => {
    const sceneConstants = parseConfiguration(sceneConfiguration);
    const scene = buildScene(sceneConstants);
    const renderer = buildRender(screenDimensions);
    const camera = buildCamera(screenDimensions);
    const audio = new GameAudio(camera, sceneConfiguration.audio);
    buildLight(scene);

    const floorConfig = sceneConstants.floor;
    const floor = Floor(scene, floorConfig);
    const sceneSubjects = [
        GeneralLights(scene),
        floor,
    ];
    audio.playSound("MUSIC", camera);

    Object.keys(models).forEach(model => {
        sceneSubjects.push(ModelLoader(scene, models[model].config, ModelType.GLTF, Model[model], null, models[model].gltf));
    });
    let obj;

    sceneSubjects.forEach(sub => {
       if(sub.mesh && sub.mesh.name === "ISD"){
           obj = sub.mesh;
       }
    });

    setCameraPositionRelativeToMesh(camera, obj);


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

    function setCameraPositionRelativeToMesh(camera, mesh, config) {
        // spectator camera
        camera.position.x = 60;
        camera.position.z = 60;
        camera.position.y = 100;
        console.log(`spectate camera position: ${JSON.stringify(camera.position)}`);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    return {
        scene,
        camera,
        renderer,
        sceneSubjects,
    };
}

