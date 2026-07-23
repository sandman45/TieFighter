import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

export default (scene, config) => {
    const loader = new THREE.TextureLoader();
    const cubeGeometry = new THREE.BoxGeometry(
        config.skyBox.size.x,
        config.skyBox.size.y,
        config.skyBox.size.z
    );
    const cubeMaterials = [];
    const front_texture = new loader.load("/images/skybox/space/space_ft.png");
    const back_texture  = new loader.load("/images/skybox/space/space_bk.png");
    const up_texture    = new loader.load("/images/skybox/space/space_up.png");
    const down_texture  = new loader.load("/images/skybox/space/space_dn.png");
    const right_texture = new loader.load("/images/skybox/space/space_rt.png");
    const left_texture  = new loader.load("/images/skybox/space/space_lf.png");

    // BackSide only — no z-fighting, no seams from inside
    cubeMaterials.push(new THREE.MeshBasicMaterial({ map: front_texture, side: THREE.BackSide }));
    cubeMaterials.push(new THREE.MeshBasicMaterial({ map: back_texture,  side: THREE.BackSide }));
    cubeMaterials.push(new THREE.MeshBasicMaterial({ map: up_texture,    side: THREE.BackSide }));
    cubeMaterials.push(new THREE.MeshBasicMaterial({ map: down_texture,  side: THREE.BackSide }));
    cubeMaterials.push(new THREE.MeshBasicMaterial({ map: right_texture, side: THREE.BackSide }));
    cubeMaterials.push(new THREE.MeshBasicMaterial({ map: left_texture,  side: THREE.BackSide }));

    const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    // render skybox behind everything else
    cube.renderOrder = -1;
    // layer 1 only — main camera opts in (see buildCamera in the scene files),
    // the target-computer camera stays on the default layer and never sees it
    cube.layers.set(1);
    scene.add(cube);

    // return update so SceneManager can pass camera position each frame
    function update(camera) {
        if(camera) {
            cube.position.copy(camera.position);
        }
    }

    return { update };
}