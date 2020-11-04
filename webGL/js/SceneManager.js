import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Manager from './utils/Manager.js';
import sceneConfiguration from '../sceneConfig.js';
import { parseConfiguration, mapConfigurationToGUI } from './utils/SceneConfigUtils.js';
import dat from '../node_modules/dat.gui/build/dat.gui.module.js';
import MainMenu from "./scenes/menu/MainMenu.js";
import MissionOne from "./scenes/campaign/MissionOne.js";
import MultiPlayer from "./scenes/multiplayer/MultiPlayer.js";

export default canvas => {
    const sceneConstants = parseConfiguration(sceneConfiguration);
    const clock = new THREE.Clock();

    const screenDimensions = {
        width: canvas.width,
        height: canvas.height
    };
    let mp;
    let scene;
    let sceneSubjects = [];
    let controls;
    let weaponsCollision;
    let renderer;
    let camera;
    let sceneReady = false;
    const datGui = new dat.GUI();
    /**
     * LOADING SCREEN MENU
     * */
    if(sceneConstants.menu) {
        Manager(sceneConstants, (message, models) => {
            const menu = MainMenu(canvas, screenDimensions, models);
            sceneSubjects = sceneSubjects.concat(menu.sceneSubjects);
            controls = menu.controls;
            scene = menu.scene;
            renderer = menu.renderer;
            camera = menu.camera;
            sceneReady = true;
        });
    }
    /**
     * MULTIPLAYER STUFF
     */
    else if(sceneConstants.multiPlayer.active) {
        Manager(sceneConstants, (message, models) => {
            mp = MultiPlayer(canvas, screenDimensions, models, sceneSubjects);
            weaponsCollision = mp.weaponsCollision;
            mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);
            scene = mp.scene;
            renderer = mp.renderer;
            camera = mp.camera;
            sceneReady = true;
        });
    }
    /**
     * Mission ONE!
     */
    else if(sceneConstants.campaign.missionOne.active) {
        Manager(sceneConstants, (message, models) => {
            const missionOne = MissionOne(canvas, screenDimensions, models);
            sceneSubjects = missionOne.sceneSubjects;
            controls = missionOne.controls;
            weaponsCollision = missionOne.weaponsCollision;

            mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);
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
                const myWeaponsCollision = mp.getWeaponsCollision();
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
        const myControls = mp.getControls();
        if(controls){
            controls.onKeyDown(keyCode, duration);
        } else if(myControls){
            myControls.onKeyDown(keyCode, duration);
        }
    }

    function onKeyUp(keyCode) {
        const myControls = mp.getControls();
        if(controls){
            controls.onKeyUp(keyCode);
        } else if(myControls){
            myControls.onKeyUp(keyCode);
        }
    }

    return {
        update,
        onWindowResize,
        onKeyDown,
        onKeyUp
      }
}
