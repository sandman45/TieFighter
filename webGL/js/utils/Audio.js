import * as THREE from '../../node_modules/three/build/three.module.js'


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
};

let listener;
let gameCamera;
let audioLoader;
export default class GameAudio {

    constructor(camera) {
        listener = new THREE.AudioListener();
        gameCamera = camera;
        gameCamera.add(listener);
        audioLoader = new THREE.AudioLoader();

        audioLoader.load(AudioType.BLAST.url, (buffer) => {
            AudioType.BLAST.sound = new THREE.PositionalAudio(listener);
            AudioType.BLAST.sound.setBuffer(buffer);
        });

        audioLoader.load(AudioType.BLAST2.url, (buffer) => {
            AudioType.BLAST2.sound = new THREE.PositionalAudio(listener);
            AudioType.BLAST2.sound.setBuffer(buffer);
        });

        audioLoader.load(AudioType.BLAST3.url, (buffer) => {
            AudioType.BLAST3.sound = new THREE.PositionalAudio(listener);
            AudioType.BLAST3.sound.setBuffer(buffer);
        });

        audioLoader.load(AudioType.FLYBY.url, (buffer) => {
            AudioType.FLYBY.sound = new THREE.PositionalAudio(listener);
            AudioType.FLYBY.sound.setBuffer(buffer);
        });

        audioLoader.load(AudioType.FLYBY2.url, (buffer) => {
            AudioType.FLYBY2.sound = new THREE.PositionalAudio(listener);
            AudioType.FLYBY2.sound.setBuffer(buffer);
        });

        audioLoader.load(AudioType.FLYBY3.url, (buffer) => {
            AudioType.FLYBY3.sound = new THREE.PositionalAudio(listener);
            AudioType.FLYBY3.sound.setBuffer(buffer);
        });
    }

    playSound(obj, type){
        if(type === AudioType.BLAST.type){
            if(!AudioType.BLAST.sound.isPlaying){
                AudioType.BLAST.sound.play();
            } else if(!AudioType.BLAST2.sound.isPlaying){
                AudioType.BLAST2.sound.play();
            } else if(!AudioType.BLAST3.sound.isPlaying){
                AudioType.BLAST3.sound.play();
            }
        } else if(type === AudioType.FLYBY.type){
            if(!AudioType.FLYBY.sound.isPlaying){
                AudioType.FLYBY.sound.play();
            } else  if(!AudioType.FLYBY2.sound.isPlaying){
                AudioType.FLYBY2.sound.play();
            } else  if(!AudioType.FLYBY3.sound.isPlaying){
                AudioType.FLYBY3.sound.play();
            }
        }
    }

}
