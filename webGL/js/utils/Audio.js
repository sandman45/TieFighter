// import * as THREE from '../../node_modules/three/build/three.module.js'
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

const AudioType = {
    BLAST: {
        name: "BLAST",
        type: "SFX",
        url: "../assets/audio/blast.mp3",
        sound: null
    },
    BLAST2: {
        name: "BLAST2",
        type: "SFX",
        url: "../assets/audio/blast-2.mp3",
        sound: null
    },
    BLAST3: {
        name: "BLAST3",
        type: "SFX",
        url: "../assets/audio/blast-3.mp3",
        sound: null
    },
    REBEL_BLAST: {
        name: "R_BLAST",
        type: "SFX",
        url: "../assets/audio/XWing fire.mp3",
        sound: null
    },
    REBEL_BLAST2: {
        name: "R_BLAST2",
        type: "SFX",
        url: "../assets/audio/XWing fire 2.mp3",
        sound: null
    },
    REBEL_BLAST3: {
        name: "R_BLAST3",
        type: "SFX",
        url: "../assets/audio/XWing fire 3.mp3",
        sound: null
    },
    FLYBY: {
        name: "FLYBY",
        type: "SFX",
        url: "../assets/audio/fly-by.mp3",
        sound: null
    },
    FLYBY2: {
        name: "FLYBY2",
        type: "SFX",
        url: "../assets/audio/fly-by-2.mp3",
        sound: null
    },
    FLYBY3: {
        name: "FLYBY3",
        type: "SFX",
        url: "../assets/audio/fly-by-3.mp3",
        sound: null
    },
    REBEL_FLYBY: {
        name: "REBEL_FLYBY",
        type: "SFX",
        url: "../assets/audio/XWing flyby 1.mp3",
        sound: null
    },
    REBEL_FLYBY2: {
        name: "REBEL_FLYBY2",
        type: "SFX",
        url: "../assets/audio/XWing flyby 2.mp3",
        sound: null
    },
    REBEL_FLYBY3: {
        name: "REBEL_FLYBY3",
        type: "SFX",
        url: "../assets/audio/XWing flyby 3.mp3",
        sound: null
    },
    REBEL_FLYBY4: {
        name: "REBEL_FLYBY4",
        type: "SFX",
        url: "../assets/audio/XWing flyby 4.mp3",
        sound: null
    },
    REBEL_FLYBY5: {
        name: "REBEL_FLYBY5",
        type: "SFX",
        url: "../assets/audio/XWing flyby 5.mp3",
        sound: null
    },
    REBEL_FLYBY6: {
        name: "REBEL_FLYBY6",
        type: "SFX",
        url: "../assets/audio/XWing flyby 6.mp3",
        sound: null
    },
    MUSIC: {
        name: "MARCH",
        type: "MUSIC",
        url: "../assets/audio/imp-march.mp3",
        sound: null
    },
    MUSIC_FALCON: {
        name: "MARCH",
        type: "MUSIC",
        url: "../assets/audio/falcon-v-ties.mp3",
        sound: null
    },
    MUSIC_MENU: {
        name: "MUSIC_MENU",
        type: "MUSIC",
        url: "../assets/audio/main-menu.mp3",
        sound: null
    },
    MUSIC_SELECT: {
        name: "MUSIC_SELECT",
        type: "MUSIC",
        url: "../assets/audio/register.mp3",
        sound: null
    },
    HIT: {
        name: "HIT",
        type: "SFX",
        url: "../assets/audio/TIE fighter explode.mp3",
        sound: null
    },
    HIT2: {
        name: "HIT2",
        type: "SFX",
        url: "../assets/audio/XWing explode.mp3",
        sound: null
    },
    HIT3: {
        name: "HIT3",
        type: "SFX",
        url: "../assets/audio/XWing explode.mp3",
        sound: null
    },
    EXPLODE_REBEL: {
        name: "EXPLODE_REBEL",
        type: "SFX",
        url: "../assets/audio/XWing explode.mp3",
        sound: null
    },
    EXPLODE_EMPIRE: {
        name: "EXPLODE_EMPIRE",
        type: "SFX",
        url: "../assets/audio/TIE fighter explode.mp3",
        sound: null
    },
};

let listener;
let gameCamera;
let audioLoader;
let sfxVolume = 0.1;
let musicVolume = 0.1;
let audioConfig;
let audioReady = false;

// browsers start every AudioContext suspended until a user gesture unlocks it —
// the menu music plays before the player has clicked anything, so without this
// it gets silently scheduled-but-muted and never catches up on its own
function unlockAudioContext() {
    const ctx = THREE.AudioContext.getContext();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
}
window.addEventListener('pointerdown', unlockAudioContext);
window.addEventListener('keydown', unlockAudioContext);

export default (camera, config, callback) => {
    audioConfig = config;

        listener = new THREE.AudioListener();
        gameCamera = camera;
        gameCamera.add(listener);

        // AudioLoader's underlying FileLoader reports itemEnd (and so LoadingManager's
        // onLoad) as soon as the raw bytes are fetched — but decodeAudioData(), which
        // is what actually resolves *our* per-item callback below and sets `.sound`,
        // finishes later, asynchronously. Relying on manager.onLoad race-fired
        // `completed()` before `.sound` existed, and playSound("MUSIC"...) silently
        // no-op'd. Track completion ourselves against the real per-item callbacks instead.
        audioLoader = new THREE.AudioLoader();

        let remaining = 0;
        Object.keys(AudioType).forEach(audio => {
            if(!AudioType[audio].sound) remaining++;
        });

        if (remaining === 0) {
            // nothing new to load — defer so the caller's `const audio = GameAudio(...)`
            // assignment finishes before we invoke their callback (which closes over `audio`)
            Promise.resolve().then(completed);
        }

        Object.keys(AudioType).forEach(audio => {
            if(!AudioType[audio].sound) {
                audioLoader.load(AudioType[audio].url, (buffer) => {
                    if (AudioType[audio].type === "SFX" && audioConfig.sfx) {
                        AudioType[audio].sound = new THREE.PositionalAudio(listener);
                        AudioType[audio].sound.setBuffer(buffer);
                    } else if(AudioType[audio].type === "MUSIC" && audioConfig.music) {
                        AudioType[audio].sound = new THREE.Audio(listener);
                        AudioType[audio].sound.setBuffer(buffer);
                    }

                    if (AudioType[audio].type === "SFX" && audioConfig.sfx) {
                        AudioType[audio].sound.setVolume(config.sfxVolume ? config.sfxVolume : sfxVolume);
                    } else if(AudioType[audio].type === "MUSIC" && audioConfig.music) {
                        AudioType[audio].sound.setVolume(config.musicVolume ? config.musicVolume : musicVolume);
                        AudioType[audio].sound.setLoop(true);
                    }

                    remaining--;
                    if (remaining === 0) completed();
                }, undefined, (err) => {
                    onError(err);
                    remaining--;
                    if (remaining === 0) completed();
                });
            } else {
                // already loaded stop all music for last scene
                stopPlaying();
            }
        });

    function completed() {
        audioReady = true;
        callback(`Completed loading audio! ${AudioType}`);
    }

    function onError(err){
        console.log(`Error: ${err}`);
    }

    function playSound(type, obj) {
        if(audioReady) {
            if(AudioType[type].sound && AudioType[type].sound.isPlaying) {
                // MUSIC types have no "2"/"3" round-robin variants (only SFX do) — a
                // looping music track being already-playing just means leave it alone
                if(AudioType[type].type === "MUSIC") return;

                if(AudioType[`${type}2`] && AudioType[`${type}2`].sound.isPlaying){
                    if(AudioType[`${type}3`] && AudioType[`${type}3`].sound.isPlaying){
                        // dont play anything
                    } else if(AudioType[`${type}3`]) {
                        AudioType[`${type}3`].sound.play();
                    }
                } else if(AudioType[`${type}2`]) {
                    AudioType[`${type}2`].sound.play();
                }
            } else if(AudioType[type].sound) {
                AudioType[type].sound.play();
            }
        }
    }

    function stopPlaying() {
        Object.keys(AudioType).forEach(audio => {
            if(AudioType[audio].sound && AudioType[audio].type === "MUSIC" && AudioType[audio].sound.isPlaying) {
                AudioType[audio].sound.stop();
            }
        });
    }

    return {
        playSound
    }
}
