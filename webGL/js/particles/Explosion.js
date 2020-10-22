// https://github.com/squarefeet/ShaderParticleEngine/blob/master/examples/explosion.html
import eventType from "../eventBus/events.js";
import * as THREE from '../../node_modules/three/build/three.module.js';
import TextureAnimator from "./TextureAnimator.js";
const explosion = "../images/explosion/sprite-explosion2.png";
const explosion2 = "../images/explosion/explosion-4x4.jpg"; // works.. want to use the other one because it is transparent
const smokeParticle = "../images/explosion/smokeparticle.png";

export default (scene, position, type, audio) => {
    const texture = new THREE.ImageUtils.loadTexture(explosion2);
    const explode = new TextureAnimator(texture, 4, 4, 16, 55, destroy);
    const geometry = new THREE.PlaneGeometry(4, 4, 4);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true});
    const mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);
    mesh.visible = false;

    function destroy() {
        // scene.remove(mesh);
        setTimeout(()=>{
            mesh.visible = false;
        }, 250);
    }

    function update(time) {
        if(mesh.visible){
            explode.update(50);
        }
    }

    function trigger(position){
        mesh.position.set(position.x, position.y, position.z);
        mesh.visible = true;
    }

    return {
        name: eventType.EXPLOSION,
        update,
        mesh,
        trigger,
        destroy
    }
}

