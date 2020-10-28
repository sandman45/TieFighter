// import * as THREE from '../../node_modules/three/build/three.module.js'
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

const AudioType = {
  BLAST: {
      type: "BLAST",
      url: "../assets/audio/blast.mp3",
      sound: null
  },
  BLAST2: {
      type: "BLAST2",
      url: "../assets/audio/blast-2.mp3",
      sound: null
  },
  BLAST3: {
      type: "BLAST3",
      url: "../assets/audio/blast-3.mp3",
      sound: null
  },
  FLYBY: {
      type: "FLYBY",
      url: "../assets/audio/fly-by.mp3",
      sound: null
  },
  FLYBY2: {
      type: "FLYBY",
      url: "../assets/audio/fly-by-2.mp3",
      sound: null
  },
  FLYBY3: {
      type: "FLYBY",
      url: "../assets/audio/fly-by-3.mp3",
      sound: null
  },
  MUSIC: {
      type: "MUSIC",
      url: "../assets/audio/Imperial-March.mp3",
      sound: null
  }
};

let listener;
let gameCamera;
let audioLoader;
let sfxVolume = 40;
let musicVolume = 40;
let audioConfig;
export default class GameAudio {

    constructor(camera, config) {
        audioConfig = config;
        if(audioConfig.music) {
            listener = new THREE.AudioListener();
            gameCamera = camera;
            gameCamera.add(listener);
            audioLoader = new THREE.AudioLoader();

            audioLoader.load(AudioType.MUSIC.url, (buffer) => {
                AudioType.MUSIC.sound = new THREE.PositionalAudio(listener);
                AudioType.MUSIC.sound.setBuffer(buffer);
                AudioType.MUSIC.sound.setVolume(sfxVolume);
                AudioType.BLAST.sound.setVolume(sfxVolume);
                AudioType.MUSIC.sound.play(musicVolume);
            });

            audioLoader.load(AudioType.BLAST.url, (buffer) => {
                AudioType.BLAST.sound = new THREE.PositionalAudio(listener);
                AudioType.BLAST.sound.setBuffer(buffer);
                AudioType.BLAST.sound.setVolume(sfxVolume);
            });

            audioLoader.load(AudioType.BLAST2.url, (buffer) => {
                AudioType.BLAST2.sound = new THREE.PositionalAudio(listener);
                AudioType.BLAST2.sound.setBuffer(buffer);
                AudioType.BLAST2.sound.setVolume(sfxVolume);
            });

            audioLoader.load(AudioType.BLAST3.url, (buffer) => {
                AudioType.BLAST3.sound = new THREE.PositionalAudio(listener);
                AudioType.BLAST3.sound.setBuffer(buffer);
                AudioType.BLAST3.sound.setVolume(sfxVolume);
            });

            audioLoader.load(AudioType.FLYBY.url, (buffer) => {
                AudioType.FLYBY.sound = new THREE.PositionalAudio(listener);
                AudioType.FLYBY.sound.setBuffer(buffer);
                AudioType.BLAST.sound.setVolume(sfxVolume);
            });

            audioLoader.load(AudioType.FLYBY2.url, (buffer) => {
                AudioType.FLYBY2.sound = new THREE.PositionalAudio(listener);
                AudioType.FLYBY2.sound.setBuffer(buffer);
                AudioType.FLYBY2.sound.setVolume(sfxVolume);
            });

            audioLoader.load(AudioType.FLYBY3.url, (buffer) => {
                AudioType.FLYBY3.sound = new THREE.PositionalAudio(listener);
                AudioType.FLYBY3.sound.setBuffer(buffer);
                AudioType.FLYBY3.sound.setVolume(sfxVolume);
            });
        }
    }

    playSound(obj, type) {
        if (audioConfig.music) {
            if (type === AudioType.BLAST.type) {
                if (!AudioType.BLAST.sound.isPlaying) {
                    AudioType.BLAST.sound.play();
                } else if (!AudioType.BLAST2.sound.isPlaying) {
                    AudioType.BLAST2.sound.play();
                } else if (!AudioType.BLAST3.sound.isPlaying) {
                    AudioType.BLAST3.sound.play();
                }
            } else if (type === AudioType.FLYBY.type) {
                if (!AudioType.FLYBY.sound.isPlaying) {
                    AudioType.FLYBY.sound.play();
                } else if (!AudioType.FLYBY2.sound.isPlaying) {
                    AudioType.FLYBY2.sound.play();
                } else if (!AudioType.FLYBY3.sound.isPlaying) {
                    AudioType.FLYBY3.sound.play();
                }
            }
        }
    }
}
