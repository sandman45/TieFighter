import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

import Manager from './utils/Manager.js';
import sceneConfiguration from '../sceneConfig.js';
import { parseConfiguration } from './utils/SceneConfigUtils.js';
import MainMenu from "./scenes/menu/MainMenu.js";
import MissionOne from "./scenes/campaign/MissionOne.js";
import MultiPlayer from "./scenes/multiplayer/MultiPlayer.js";
import ShipSelect from "./scenes/multiplayer/ShipSelect.js";
import campaign from "./campaignMenu/campaign.js";
import { TargetingReticle } from './HUD/targetingReticle.js';
import eventBus from './eventBus/EventBus.js';
import eventBusEvents from './eventBus/events.js';

export default (views, screen) => {
    const sceneConstants = parseConfiguration(sceneConfiguration);
    const clock = new THREE.Clock();

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
    let reticle = null;
    let overlayCanvas = null;

    let screenDimensions = {
        width: views[0].canvas.width,
        height: views[0].canvas.height
    };

    overlayCanvas = document.getElementById('reticle-overlay');
    overlayCanvas.width  = window.innerWidth;
    overlayCanvas.height = window.innerHeight;

    eventBus.subscribe(eventBusEvents.TARGET_CHANGED, ({ mesh }) => {
        if (reticle) {
            mesh ? reticle.setTarget(mesh) : reticle.clearTarget();
        }
    });


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
        showLoading();
        Manager(sceneConstants.menu, (message, models) => {
            const menu = MainMenu(views[0].canvas, models);
            sceneSubjects = sceneSubjects.concat(menu.sceneSubjects);
            controls = menu.controls;
            scene = menu.scene;
            views[0].renderer = menu.renderer;
            views[0].camera = menu.camera;

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
        showLoading();
        Manager(sceneConstants.shipSelect, (message, models) => {
            ss = ShipSelect(views[0].canvas, models);
            sceneSubjects = sceneSubjects.concat(ss.sceneSubjects);
            weaponsCollision = ss.weaponsCollision;
            scene = ss.scene;
            views[0].renderer = ss.renderer;
            views[0].camera = ss.camera;
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
        mp = MultiPlayer(views[0].canvas, views[1].canvas, sceneSubjects);
        weaponsCollision = mp.weaponsCollision;
        // mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);
        scene = mp.scene;
        views[0].renderer = mp.renderer;
        views[0].camera = mp.camera;
        views[1].camera = mp.targetCamera;
        views[1].renderer = mp.targetRenderer;
        weaponsCollision = mp.getWeaponsCollision();
        sceneReady = true;
    }
    /**
     * Campaign Screen!
     */
    else if(screen === "campaign") {
        // TODO: campaign screen with some cool animations ships flying by
        // TODO: relative to campaign story etc
        // const campaignConfig = campaign.missionOne;
        // Manager(campaignConfig, (message, models) => {
        //     const missionOne = MissionOne(canvas, screenDimensions, models, campaignConfig);
        //     sceneSubjects = missionOne.sceneSubjects;
        //     controls = missionOne.controls;
        //     weaponsCollision = missionOne.weaponsCollision;
        //
        //     // mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);
        //     scene = missionOne.scene;
        //     renderer = missionOne.renderer;
        //     camera = missionOne.camera;
        //     sceneReady = true;
        // });
    } /**
     * Mission ONE!
     */
    else if(mission > -1) {
        // TODO: dynamically create from object/json based on mission selection
        // show loading screen while assets load
        showLoading();
        const campaignConfig = campaign[screen];
        Manager(campaignConfig, (message, models) => {
            const missionOne = MissionOne(views[0].canvas, views[1].canvas, models, campaignConfig);
            sceneSubjects = missionOne.sceneSubjects;
            controls = missionOne.controls;
            weaponsCollision = missionOne.weaponsCollision;

            // mapConfigurationToGUI(sceneConstants, sceneConfiguration, controls, datGui, sceneConfiguration);
            scene = missionOne.scene;
            views[0].renderer = missionOne.renderer;
            views[0].camera = missionOne.camera;
            views[1].camera = missionOne.targetCamera;
            views[1].renderer = missionOne.targetRenderer;
            sceneReady = true;
        });
    }

    // helper at the top of SceneManager, before the if/else chain
    function showLoading() {
        console.log("Loading starting SHOW Loading bar");
        const loadingElem = document.getElementById('loading');
        loadingElem.style.display = 'flex';
        loadingElem.style.visibility = "visible";
        // force reflow so the transition fires correctly
        void loadingElem.offsetWidth;
        loadingElem.style.opacity = '1';
        // reset bar
        const bar = document.getElementById('progressbar');
        if(bar) bar.style.width = '0%';
        const loadingText = document.querySelector('#loading > div > div:first-child');
        if(loadingText) loadingText.textContent = '...loading...';
    }

    function update() {
        if (sceneReady) {
            const elapsedTime = clock.getElapsedTime();
            const dt = clock.getDelta();

            // update skybox to follow camera
            if(views[0].camera) {
                scene && scene.children.forEach(child => {
                    // skybox cube has no name — identify by geometry type
                    if(child.geometry && child.geometry.type === 'BoxGeometry' && child.renderOrder === -1) {
                        child.position.copy(views[0].camera.position);
                    }
                });
            }

            if (!reticle && views[0].camera) {
                reticle = new TargetingReticle(overlayCanvas, views[0].camera);
            }

            if (sceneSubjects.length > 0) {
                if (mp) {
                    myWeaponsCollision = mp.getWeaponsCollision();
                    sceneSubjects = mp.getSceneSubjects();
                }
                if (weaponsCollision) {
                    weaponsCollision.checkCollision(sceneSubjects);
                } else if (myWeaponsCollision) {
                    myWeaponsCollision.checkCollision(sceneSubjects);
                }
                for (let i = 0; i < sceneSubjects.length; i++) {
                    sceneSubjects[i].update(elapsedTime);
                }
            }
            if (reticle) reticle.update(dt);
            // multiple views/cameras (for targeting computer)
            for (let ii = 0; ii < views.length; ++ii) {
                const view     = views[ii];
                const camera   = view.camera;
                const renderer = view.renderer;
                if (scene && camera && renderer) {
                    renderer.render(scene, camera);
                }
            }
        }

    }

    function onWindowResize() {
        for (let j = 0; j < views.length; ++j) {
            if (j === 0) {
                const { width, height } = views[j].canvas;

                if (screenDimensions) {
                    screenDimensions.width  = width;
                    screenDimensions.height = height;
                }
                if (views[j].camera) {
                    views[j].camera.aspect = width / height;
                    views[j].camera.updateProjectionMatrix();
                }
                if (views[j].renderer) {
                    views[j].renderer.setSize(width, height);
                }

                if (overlayCanvas) {
                    overlayCanvas.width  = window.innerWidth;
                    overlayCanvas.height = window.innerHeight;
                }

                // console.log(`onWindowResize index:${j} = width: ${width}, height: ${height}`);
            }
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
