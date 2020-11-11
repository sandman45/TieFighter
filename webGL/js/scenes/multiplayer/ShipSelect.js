import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Floor from "../../sceneSubjects/Floor.js";
import GeneralLights from "../../sceneSubjects/GeneralLights.js";
import { parseConfiguration } from "../../utils/SceneConfigUtils.js";
import sceneConfiguration from "../../../sceneConfig.js";
import GameAudio from "../../utils/Audio.js";
import SkyBox from "../../sceneSubjects/SkyBox.js";
import ModelLoader, { Model } from "../../utils/ModelLoader.js";
import EventBus from "../../eventBus/EventBus.js";
import events from "../../eventBus/events.js";

export default (canvas, screenDimensions, models) => {
    const sceneConstants = parseConfiguration(sceneConfiguration);
    const scene = buildScene(sceneConstants);
    const renderer = buildRender(screenDimensions);
    const camera = buildCamera(screenDimensions);
    const audio = GameAudio(camera, sceneConfiguration.audio, () => {
        audio.playSound("MUSIC_SELECT", camera);
    });
    buildLight(scene);
    let moving = false;
    let shipInfo = false;
    const floorConfig = sceneConstants.floor;
    const floor = Floor(scene, floorConfig);
    const sceneSubjects = [
        GeneralLights(scene),
        floor,
    ];


    Object.keys(models).forEach(model => {
        sceneSubjects.push(ModelLoader(scene, models[model].config, Model[model], null, models[model].gltf));
    });
    let obj = null;

    sceneSubjects.forEach(sub => {
        if(sub.mesh && sub.mesh.name === "TIE_BOMBER"){
            obj = sub.mesh;
        }
    });

    setCameraPositionRelativeToMesh(camera, obj);

    updateShips();

    EventBus.post(events.SHIP_SELECTION_CHANGE, "TIE_FIGHTER");

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
        camera.position.x = 0;
        camera.position.y = 5;
        camera.position.z = -10;
        console.log(`spectate camera position: ${JSON.stringify(camera.position)}`);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    function updateShips(){
        sceneSubjects.forEach((ship) => {
            if(ship.mesh){
                animateShip(ship.mesh);
            }
        });
    }

    function animateShip(mesh) {
        let tweenObj = { y: "+" + Math.PI*2 };
        new TWEEN.Tween(mesh.rotation)
            .to(tweenObj, 7000)
            .start()
            .repeat(Infinity);
    }

    function onSelect(){
        let element;
        let finalXPos;
        let finalYPos;
        let finalZPos;
        let visibility;
        element = document.getElementById("shipInfoLeft");
        if(!shipInfo){
            finalXPos = camera.position.x + 2;
            finalYPos = camera.position.y - 1;
            finalZPos = camera.position.z + 5;
            shipInfo = true;
            console.log(`shipInfo ${shipInfo} => x: ${finalXPos} y: ${finalYPos} z: ${finalZPos}`);
            // show info box
            visibility = "visible";
        } else {
            finalXPos = camera.position.x - 2;
            finalYPos = camera.position.y + 1;
            finalZPos = camera.position.z - 5;
            shipInfo = false;
            console.log(`shipInfo ${shipInfo} => x: ${finalXPos} y: ${finalYPos} z: ${finalZPos}`);
            // show info box
            visibility = "hidden";
        }
        let tweenObj = { x: finalXPos, y: finalYPos, z: finalZPos };
        new TWEEN.Tween(camera.position)
            .to(tweenObj, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete( () => {
                element.style.visibility = visibility;
            })
            .start();
    }

    function onKeyDown(keycode, duration){
        let tweenObj;
        let finalPos;
        if(moving){
            return;
        }
        moving = true;
        if(keycode === 37 && camera.position.x < 40){
            //move camera left
            finalPos = camera.position.x + 10;
            tweenObj = { x: finalPos };
        } else if(keycode === 39 && camera.position.x > 1){
            //move camera right
            finalPos = camera.position.x - 10;
            tweenObj = { x: finalPos };
        }
        new TWEEN.Tween(camera.position)
            .to(tweenObj, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete( () => {
                moving = false;
                // send out event for selection
                const modelName = getModelInView(models, finalPos);
                if(modelName){
                    EventBus.post(events.SHIP_SELECTION_CHANGE, modelName);
                }
            })
            .start();
    }

    function getModelInView(models, finalPos) {
        let shipInView = null;
        Object.keys(models).forEach(model => {
            if(models[model].config.position.x === finalPos){
                shipInView = model;
            }
        });
        return shipInView;
    }

    function onKeyUp(keycode){

    }

    return {
        scene,
        camera,
        renderer,
        onKeyUp,
        onKeyDown,
        onSelect,
        sceneSubjects,
    };
}

