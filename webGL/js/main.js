import SceneManager from './SceneManager.js';
import initSocketIO from './SocketIO.js';

initSocketIO(onKeyUp, onKeyDown);

const canvas = document.getElementById('canvas');
const sceneManager = SceneManager(canvas);

bindEventListeners();
startRenderLoop();

function bindEventListeners() {
	window.onresize = resizeCanvas;
	window.onkeydown = onKeyDown;
	window.onkeyup = onKeyUp;
	resizeCanvas();
}

function resizeCanvas() {
	canvas.style.width = '100%';
	canvas.style.height= '100%';

	canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

    sceneManager.onWindowResize();
}

function onKeyDown(event, duration) {
	sceneManager.onKeyDown(event.keyCode, duration);
}

function onKeyUp(event) {
	sceneManager.onKeyUp(event.keyCode);
}

function startRenderLoop(time) {
    requestAnimationFrame(startRenderLoop);
	sceneManager.update();
	TWEEN.update(time);
}
