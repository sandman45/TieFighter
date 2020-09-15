import * as THREE from '../../node_modules/three/build/three.module.js'

export default (scene, floorConfig) => {
	const geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
	const material = new THREE.MeshStandardMaterial( { wireframe: true, color: '#fff', roughness: 0.5, metalness: 0.1} );
	const cube = new THREE.Mesh( geometry, material );
	// cube.material.transparent = true;
	cube.receiveShadow = true;
	scene.add(cube);

	function update(time) {
		cube.scale.set( floorConfig.size.x, 1, floorConfig.size.y );
		// cube.material.uniforms.transparent = floorConfig.transparent;
	}

	function checkCollision(position) {
		if(Math.abs(position.x) > floorConfig.size.x/2 || Math.abs(position.z) > floorConfig.size.y/2 ) {
			return { collision: true, name: 'floor-border' };
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
