import * as THREE from '../../node_modules/three/build/three.module.js';

export default function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {
    // note: texture passed by reference, will be updated by the update function.

    let tilesHorizontal = tilesHoriz;
    let tilesVertical = tilesVert;
    // how many images does this spritesheet contain?
    //  usually equals tilesHoriz * tilesVert, but not necessarily,
    //  if there at blank tiles at the bottom of the spritesheet.
    let numberOfTiles = numTiles;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1 / tilesHorizontal, 1 / tilesVertical );

    // how long should each image be displayed?
    let tileDisplayDuration = tileDispDuration;

    // how long has the current image been displayed?
    let currentDisplayTime = 0;

    // which image is currently being displayed?
    let currentTile = 0;

    this.update = function( milliSec )
    {
        currentDisplayTime += milliSec;
        while (currentDisplayTime > tileDisplayDuration)
        {
            currentDisplayTime -= tileDisplayDuration;
            currentTile++;
            if (currentTile === numberOfTiles)
                currentTile = 0;
            let currentColumn = currentTile % tilesHorizontal;
            texture.offset.x = currentColumn / tilesHorizontal;
            let currentRow = Math.floor( currentTile / tilesHorizontal );
            texture.offset.y = currentRow / tilesVertical;
        }
    };
}
