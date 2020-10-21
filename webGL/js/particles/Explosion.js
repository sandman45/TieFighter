// https://github.com/squarefeet/ShaderParticleEngine/blob/master/examples/explosion.html

import * as THREE from '../../node_modules/three/build/three.module.js';
import TextureAnimator from "./TextureAnimator.js";
const explosion = "../images/explosion/sprite-explosion2.png";
const smokeParticle = "../images/explosion/smokeparticle.png";

let boomer;
let cube;

export default (scene, position, type, audio) => {
    // const spriteMap = new THREE.TextureLoader().load( explosion );
    // const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteMap }));
    const texture = new THREE.TextureLoader().load(explosion);
    //TODO: need to get the animation for the exposion correct..
    const explode = new TextureAnimator(texture, 4, 4, 16, 55);
    const geometry = new THREE.PlaneGeometry(5, 5, 5);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true});
    const mesh = new THREE.Mesh( geometry, material );
    // this.position = position;
    scene.add(mesh);

    return {
     update: explode.update,
     mesh
    }
}

