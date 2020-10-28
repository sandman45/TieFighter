// import * as THREE from '../../node_modules/three/build/three.module.js'
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
export default (scene) => {
    const loader = new THREE.TextureLoader();
    // loader.crossOrigin = "";
    const cubeGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const cubeMaterials = [];
    const front_texture = new loader.load("/images/skybox/space/space_ft.png");
    const back_texture = new loader.load("/images/skybox/space/space_bk.png");
    const up_texture = new loader.load("/images/skybox/space/space_up.png");
    const down_texture = new loader.load("/images/skybox/space/space_dn.png");
    const right_texture = new loader.load("/images/skybox/space/space_rt.png");
    const left_texture = new loader.load("/images/skybox/space/space_lf.png");

    const front = new THREE.MeshBasicMaterial( { map: front_texture, side: THREE.DoubleSide });
    const back = new THREE.MeshBasicMaterial( { map: back_texture, side: THREE.DoubleSide });
    const up = new THREE.MeshBasicMaterial( { map: up_texture, side: THREE.DoubleSide });
    const down = new THREE.MeshBasicMaterial( { map: down_texture, side: THREE.DoubleSide });
    const right = new THREE.MeshBasicMaterial( { map: right_texture, side: THREE.DoubleSide });
    const left = new THREE.MeshBasicMaterial( { map: left_texture, side: THREE.DoubleSide });

    cubeMaterials.push(front);
    cubeMaterials.push(back);
    cubeMaterials.push(up);
    cubeMaterials.push(down);
    cubeMaterials.push(right);
    cubeMaterials.push(left);

    const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    scene.add(cube);
}
