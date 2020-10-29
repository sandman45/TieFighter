// import * as THREE from '../../node_modules/three/build/three.module.js'
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
export default (scene, floorConfig) => {
	const geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
	const material = new THREE.MeshBasicMaterial({color:0xff0000, transparent:true, opacity:0.0, side: THREE.DoubleSide});
	const cube = new THREE.Mesh( geometry, material );
	cube.receiveShadow = true;
	scene.add(cube);

	function update(time) {
		cube.scale.set( floorConfig.size.x, 1, floorConfig.size.y );
		// cube.material.uniforms.transparent = floorConfig.transparent;
	}

	function checkCollision(obj) {
		if(Math.abs(obj.position.x) > floorConfig.size.x/2 || Math.abs(obj.position.z) > floorConfig.size.y/2 ) {
			return { collision: true, name: 'floor-border' };
		} else if(Math.abs(obj.position.y) > floorConfig.size.z/2 || Math.abs(obj.position.y) > floorConfig.size.z/2 ) {
			return { collision: true, name: 'floor-ceiling' };
		}
		else {
			return { collision: false };
		}
	}

	return {
		update,
		checkCollision
	}
}
