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
    // if(modelConfig.multiPlayer.active){
    //     modelConfig.multiPlayer.imperials.forEach((imp => {
    //         models[imp.name] = {
    //             url: modelTypes[imp.name].url,
    //             config: imp
    //         };
    //     }));
    //
    //     modelConfig.multiPlayer.rebels.forEach((rebel => {
    //         models[rebel.name] = {
    //             url: modelTypes[rebel.name].url,
    //             config: rebel
    //         };
    //     }));
    // } else if(modelConfig.shipSelect.active){
    //     modelConfig.shipSelect.imperials.forEach((imp => {
    //         models[imp.name] = {
    //             url: modelTypes[imp.name].url,
    //             config: imp
    //         };
    //     }));
    //
    //     modelConfig.shipSelect.rebels.forEach((rebel => {
    //         models[rebel.name] = {
    //             url: modelTypes[rebel.name].url,
    //             config: rebel
    //         };
    //     }));
    // }
    // TODO: maybe just put it all in ships? and have a field that
    // designates rebel or empire
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


    // else {
    //     models[modelConfig.campaign.missionOne.player.designation] = {
    //         url: modelTypes[modelConfig.campaign.missionOne.player.name].url,
    //         config: modelConfig.campaign.missionOne.player
    //     };
    //
    //     modelConfig.campaign.missionOne.imperials.forEach((imp => {
    //         models[imp.designation] = {
    //             url: modelTypes[imp.name].url,
    //             config: imp
    //         };
    //     }));
    //
    //     modelConfig.campaign.missionOne.rebels.forEach((rebel => {
    //         models[rebel.designation] = {
    //             url: modelTypes[rebel.name].url,
    //             config: rebel
    //         };
    //     }));
    // }

    const manager = new THREE.LoadingManager();
    manager.onLoad = completed;
    manager.onProgress = progress;

    const progressbarElem = document.querySelector('#progressbar');

    const gltfLoader = new GLTFLoader(manager);
    for (const model of Object.values(models)) {
        gltfLoader.load(model.url, (gltf) => {
            model.gltf = gltf;
        });
    }

    function completed() {
        // hide the loading bar
        const loadingElem = document.querySelector('#loading');
        loadingElem.style.display = 'none';
        callback("completed loading models!", models);
    }

    function progress(url, itemsLoaded, itemsTotal) {

        progressbarElem.style.width = `${itemsLoaded / itemsTotal * 100 | 0}%`;
        // console.log(`Loading file: ${url} .\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);

    }
}


