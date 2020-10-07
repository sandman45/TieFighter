import * as THREE from '../../node_modules/three/build/three.module.js'

export default camera => {
// create an AudioListener and add it to the camera
    const listener = new THREE.AudioListener();
    camera.add( listener );

// create a global audio source
    const sound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( '../assets/audio/blast.mp3', function( buffer ) {
        // console.log(`sound loaded: `);
        sound.setBuffer( buffer );
        sound.setLoop( false );
        sound.setVolume( 1 );
        // sound.play();
    });
    return { audioLoader, sound };
}
