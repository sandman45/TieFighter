import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Manager from './utils/Manager.js';
import sceneConfiguration from '../sceneConfig.js';
import { parseConfiguration } from './utils/SceneConfigUtils.js';
import MainMenu from "./scenes/menu/MainMenu.js";
import MissionOne from "./scenes/campaign/MissionOne.js";
import MultiPlayer from "./scenes/multiplayer/MultiPlayer.js";
import ShipSelect from "./scenes/multiplayer/ShipSelect.js";

export default (canvas, screen) => {
    const sceneConstants = parseConfiguration(sceneConfiguration);
    const clock = new THREE.Clock();

    const screenDimensions = {
        width: canvas.width,
        height: canvas.height
    };
    let mp;
    let ss;
    let scene;
    let sceneSubjects = [];
    let controls;
    let weaponsCollision;
    let myWeaponsCollision;
    let renderer;
    let camera;
    let sceneReady = false;

    /**
     * LOADING SCREEN MENU
     * */
    if(screen === "menu") {
        Manager(sceneConstants.menu, (message, models) => {
            const menu = MainMenu(canvas, screenDimensions, models);
            sceneSubjects = sceneSubjects.concat(menu.sceneSubjects);
            controls = menu.controls;
            scene = menu.scene;
            renderer = menu.renderer;
            camera = menu.camera;
            sceneReady = true;
            menu.getWeaponsCollision = () => {
                return null;
            };
            // show btn container
            const element = document.getElementById("menu");
            element.style.visibility = "visible";
        });
    }
    /**
     * SHIPSELECT STUFF
     */
    else if(screen === "shipselect") {
        const loadingElem = document.getElementById('loading');
        loadingElem.style.visibility = 'visible';
        Manager(sceneConstants.shipSelect, (message, models) => {
            ss = ShipSelect(canvas, screenDimensions, models);
            sceneSubjects = sceneSubjects.concat(ss.sceneSubjects);
            weaponsCollision = ss.weaponsCollision;
            scene = ss.scene;
            renderer = ss.renderer;
            camera = ss.camera;
            sceneReady = true;
            controls = {
              onKeyDown: ss.onKeyDown,
              onKeyUp: ss.onKeyUp
            };
        });
    }
    /**
     * MULTIPLAYER STUFF
     */
    else if(screen === "multiplayer") {
        mp = MultiPlayer(canvas, screenDimensions, sceneSubjects);
        weaponsCollision = mp.weaponsCollision;
        // mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);
        scene = mp.scene;
        renderer = mp.renderer;
        camera = mp.camera;
        weaponsCollision = mp.getWeaponsCollision();
        sceneReady = true;
    }
    /**
     * Mission ONE!
     */
    else if(screen === "missionone") {
        Manager(sceneConstants, (message, models) => {
            const missionOne = MissionOne(canvas, screenDimensions, models);
            sceneSubjects = missionOne.sceneSubjects;
            controls = missionOne.controls;
            weaponsCollision = missionOne.weaponsCollision;

            // mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);
            scene = missionOne.scene;
            renderer = missionOne.renderer;
            camera = missionOne.camera;
            sceneReady = true;
        });
    }

    function update() {
        if(sceneReady){
            const elapsedTime = clock.getElapsedTime();
            if(sceneSubjects.length > 0){
                if(mp){
                    myWeaponsCollision = mp.getWeaponsCollision();
                    sceneSubjects = mp.getSceneSubjects();
                }
                if(weaponsCollision){
                    weaponsCollision.checkCollision(sceneSubjects);
                } else if(myWeaponsCollision) {
                    myWeaponsCollision.checkCollision(sceneSubjects);
                }
                for(let i = 0; i < sceneSubjects.length; i++) {
                    sceneSubjects[i].update(elapsedTime);
                }
            }
            renderer.render(scene, camera);
        }
    }

    function onWindowResize() {
        const { width, height } = canvas;
        if(screenDimensions){
            screenDimensions.width = width;
            screenDimensions.height = height;
        }

        if(camera){
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }

        if(renderer){
            renderer.setSize(width, height);
        }
    }

    function onKeyDown(keyCode, duration) {
        if(mp){
            controls = mp.getControls();
        }

        if(controls){
            controls.onKeyDown(keyCode, duration);
        }
    }

    function onKeyUp(keyCode) {
        if(mp){
            controls = mp.getControls();
        }
        if(controls) {
            controls.onKeyUp(keyCode);
        }
    }

    function btnClickFromMenu() {
        ss.onSelect();
    }

    return {
        update,
        onWindowResize,
        onKeyDown,
        onKeyUp,
        btnClickFromMenu
      }
}
