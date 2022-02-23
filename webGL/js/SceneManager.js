import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Manager from './utils/Manager.js';
import sceneConfiguration from '../sceneConfig.js';
import { parseConfiguration } from './utils/SceneConfigUtils.js';
import MainMenu from "./scenes/menu/MainMenu.js";
import MissionOne from "./scenes/campaign/MissionOne.js";
import MultiPlayer from "./scenes/multiplayer/MultiPlayer.js";
import ShipSelect from "./scenes/multiplayer/ShipSelect.js";
import campaign from "./campaignMenu/campaign.js";
import CampaignDefault from "./scenes/campaign/CampaignDefault.js";

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
    let controls = null;
    let weaponsCollision = null;
    let myWeaponsCollision = null;
    let renderer = null;
    let camera = null;
    let sceneReady = false;
    const mission = screen.search("mission");
    /**
     * LOADING SCREEN MENU
     * */
    if(sceneSubjects.length > 0){
        sceneSubjects = [];
        controls = null;
        weaponsCollision = null;
        myWeaponsCollision = null;
        renderer = null;
        camera = null;
    }
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
     * Campaign Screen!
     */
    else if(screen === "campaign") {
        console.log(`screen: ${screen}`);
        // TODO: campaign screen with some cool animations ships flying by
        // TODO: relative to campaign story etc
        const campaignConfig = campaign.default;
        Manager(campaignConfig, (message, models) => {
            const campaignDefaultScene = CampaignDefault(canvas, screenDimensions, models, campaignConfig);
            sceneSubjects = campaignDefaultScene.sceneSubjects;
            controls = campaignDefaultScene.controls;
            weaponsCollision = campaignDefaultScene.weaponsCollision;
            scene = campaignDefaultScene.scene;
            renderer = campaignDefaultScene.renderer;
            camera = campaignDefaultScene.camera;
            sceneReady = true;
        });
    } /**
     * Mission ONE!
     */
    else if(mission > -1) {
        // TODO: dynamically create from object/json based on mission selection
        const campaignConfig = campaign[screen];
        Manager(campaignConfig, (message, models) => {
            const missionOne = MissionOne(canvas, screenDimensions, models, campaignConfig);
            sceneSubjects = missionOne.sceneSubjects;
            controls = missionOne.controls;
            weaponsCollision = missionOne.weaponsCollision;
            scene = missionOne.scene;
            renderer = missionOne.renderer;
            camera = missionOne.camera;
            sceneReady = true;
            // mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);
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
                    if(sceneSubjects[i]){
                        sceneSubjects[i].update(elapsedTime);
                    }
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
        if(keyCode === 88){
            sceneSubjects.forEach(sub=>{
                if(sub.playAnimations){
                    sub.playAnimations();
                }
            });
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
