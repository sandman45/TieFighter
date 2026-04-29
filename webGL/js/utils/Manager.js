import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';

export default (modelConfig, callback) => {

    const modelTypes = {
        TIE_FIGHTER: {
            url: "models/tie-fighter/tie.glb",
        },
        TIE_BOMBER: {
            url: "models/tie-bomber/tie-bomber.glb",
        },
        TIE_INTERCEPTOR: {
            url: "models/tie-interceptor/tie-interceptor.glb",
        },
        TIE_ADVANCED: {
            url: "models/tie-advanced/tie-advanced.glb",
        },
        TIE_DEFENDER: {
            url: "models/tie-defender/tie-defender.glb",
        },
        SHUTTLE: {
            url: "models/shuttle/shuttle.glb",
        },
        ISD: {
            url: "models/destroyer/isd.glb",
        },
        A_WING: {
            url: "models/a-wing.glb",
        },
        B_WING: {
            url: "models/b-wing.glb",
        },
        X_WING: {
            url: "models/x-wing.glb",
        },
        Y_WING: {
            url: "models/y-wing.glb",
        }
    };

    const models = {};

    if(modelConfig.type === "CAMPAIGN") {
        modelConfig.imperials.forEach((imp => {
            models[imp.designation] = {
                url: modelTypes[imp.name].url,
                config: imp
            };
        }));

        modelConfig.rebels.forEach((rebel => {
            models[rebel.designation] = {
                url: modelTypes[rebel.name].url,
                config: rebel
            };
        }));
    } else {
        modelConfig.imperials.forEach((imp => {
            models[imp.name] = {
                url: modelTypes[imp.name].url,
                config: imp
            };
        }));

        modelConfig.rebels.forEach((rebel => {
            models[rebel.name] = {
                url: modelTypes[rebel.name].url,
                config: rebel
            };
        }));
    }

    const manager = new THREE.LoadingManager();
    manager.onLoad = completed;
    manager.onProgress = progress;

    const progressbarElem = document.getElementById('progressbar');

    const gltfLoader = new GLTFLoader(manager);
    for (const model of Object.values(models)) {
        gltfLoader.load(model.url, (gltf) => {
            model.gltf = gltf;
        });
    }

    function completed() {
        const loadingElem = document.getElementById('loading');
        if(progressbarElem) progressbarElem.style.width = '100%';
        const loadingText = document.querySelector('#loading > div > div:first-child');
        if(loadingText) loadingText.textContent = '100%';

        setTimeout(() => {
            loadingElem.style.opacity = '0';
            setTimeout(() => {
                loadingElem.style.display = 'none';
            }, 600); //600
        }, 300); //300
        console.log("Loading complete HIDE Loading bar");
        callback("completed loading models!", models);
    }

    function progress(url, itemsLoaded, itemsTotal) {
        if(!progressbarElem) return;
        const pct = Math.min((itemsLoaded / itemsTotal) * 100, 95);
        progressbarElem.style.width = `${pct | 0}%`;

        // update the loading text with a live count
        const loadingText = document.querySelector('#loading > div > div:first-child');
        if(loadingText) {
            loadingText.textContent = `${pct | 0}%`;
        }
    }
}


