import SceneManager from './SceneManager.js';
import initSocketIO from './SocketIO.js';
import handler from './menuHandler.js';
import EventBus from "./eventBus/EventBus.js";
import events from "./eventBus/events.js";
import LocalStorage from "./localStorage/localStorage.js";

initSocketIO(onKeyUp, onKeyDown);
// initial state is menu
const canvas = document.getElementById('canvas');
let sceneManager = SceneManager(canvas, "menu");
bindEventListeners();
startRenderLoop();
let showMenu;
function bindEventListeners() {
	handler.currentSelectionInView();
	window.onresize = resizeCanvas;
	window.onkeydown = onKeyDown;
	window.onkeyup = onKeyUp;
	const menuItems = document.getElementsByClassName("menu-item");
	for(let i=0; i<menuItems.length; i++){
		menuItems[i].onclick = onMenuItemClick;
	}
	const subMenuItems = document.getElementsByClassName("sub-menu-item");
	for(let i=0; i<subMenuItems.length; i++){
		subMenuItems[i].onclick = onSubMenuItemClick;
	}

	// const btn = document.getElementById("connectBtn");
	// btn.onclick = handler.connectToServer;

	// const pilotNameBtn = document.getElementById("pilotNameBtn");
	// pilotNameBtn.onclick = handler.pilotName;

	// for select ship btn
	const btn2 = document.getElementById("selectBtn");
	btn2.onclick = function(event){
		handler.btnClickFromMenu(event, sceneManager);
	};

	// for info ship btn
	const btn3 = document.getElementById("infoBtn");
	btn3.onclick = function(event){
		handler.btnClickFromMenu(event, sceneManager);
	};

	resizeCanvas();
}

function resizeCanvas() {
	canvas.style.width = '100%';
	canvas.style.height= '100%';

	canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

    sceneManager.onWindowResize();
}

function onMenuItemClick(event) {
	// hide btn container
	const btnContainer = document.getElementById("btn-container");
	btnContainer.style.visibility = "visible";

	// hide main menu
	const menu = document.getElementById("menu");
	menu.style.visibility = "hidden";

	// clear canvas
	const canvas = document.getElementById('canvas');
	canvas.innerHTML = "";

	// show subMenu
	const subMenu = document.getElementById("sub-menu");
	subMenu.style.visibility = "visible";

	// load scene
	const menuItem = event.currentTarget.getAttribute("name");
	sceneManager = SceneManager(canvas, menuItem);
	bindEventListeners();
	startRenderLoop();
}

function onSubMenuItemClick(event) {
	const subMenuItem = event.currentTarget.getAttribute("name");
	console.log(`sub menu item: ${subMenuItem}`);
	if(subMenuItem === "shipselect"){
		// clear canvas
		const canvas = document.getElementById('canvas');
		canvas.innerHTML = "";

		// show btn container
		const element = document.getElementById("btn-container");
		element.style.visibility = "visible";

		const loadingElem = document.getElementById('loading');
		loadingElem.style.visibility = 'visible';
		// load scene
		sceneManager = SceneManager(canvas, subMenuItem);
		bindEventListeners();
		startRenderLoop();
	} else if(subMenuItem === "start") {
		// clear canvas
		const canvas = document.getElementById('canvas');
		canvas.innerHTML = "";

		// hide menus //
		const element = document.getElementById("btn-container");
		element.style.visibility = "hidden";

		const element2 = document.getElementById("menu");
		element2.style.visibility = "hidden";

		const element3 = document.getElementById("sub-menu");
		element3.style.visibility = "hidden";

		const element4 = document.getElementById("shipInfo");
		element4.style.visibility = "hidden";

		const element5 = document.getElementById("shipInfoLeft");
		element5.style.visibility = "hidden";

        document.getElementById("start").disabled = true;

		// load scene
		sceneManager = SceneManager(canvas, "multiplayer");
		bindEventListeners();
		startRenderLoop();
        handler.startGame();
	} else if(subMenuItem === "connect") {
		// const element3 = document.getElementById("start");
		// element3.style.disabled = false;
        document.getElementById("leaveServer").disabled = false;
        document.getElementById("connect").disabled = true;
        document.getElementById("selectBtn").disabled = false;
		handler.connectToServer();
	} else if(subMenuItem === "leaveserver") {
		// clear canvas
		const canvas = document.getElementById('canvas');
		canvas.innerHTML = "";

		const element2 = document.getElementById("menu");
		element2.style.visibility = "hidden";

		const room = LocalStorage.getItem("SOCKET_ROOM");
		EventBus.post(events.LEAVE_ROOM, room);

		// show btn container
		const element = document.getElementById("btn-container");
		element.style.visibility = "visible";

        document.getElementById("connect").disabled = false;
        document.getElementById("selectBtn").disabled = true;
        document.getElementById("leaveServer").disabled = true;
		// load scene
		sceneManager = SceneManager(canvas, "shipselect");
		bindEventListeners();
		startRenderLoop();
	} else if(subMenuItem === "back") {
		const canvas = document.getElementById('canvas');
		canvas.innerHTML = "";

		// hide all except menu
		const element = document.getElementById("btn-container");
		element.style.visibility = "hidden";

		const element2 = document.getElementById("menu");
		element2.style.visibility = "visible";

		const element3 = document.getElementById("sub-menu");
		element3.style.visibility = "hidden";

		const element4 = document.getElementById("shipInfo");
		element4.style.visibility = "hidden";

		const element5 = document.getElementById("shipInfoLeft");
		element5.style.visibility = "hidden";

		const loadingElem = document.getElementById('loading');
		loadingElem.style.visibility = 'visible';

		sceneManager = SceneManager(canvas, "menu");
		bindEventListeners();
		startRenderLoop();
	}
}

function onKeyDown(event, duration) {
	if(event.keyCode === 27){
		const element3 = document.getElementById("sub-menu");
		// show menu
		if(showMenu){
			element3.style.visibility = "visible";
			showMenu = false;
		} else {
			element3.style.visibility = "hidden";
			showMenu = true;
		}
	} else {
		sceneManager.onKeyDown(event.keyCode, duration);
	}
}

function onKeyUp(event) {
	sceneManager.onKeyUp(event.keyCode);
}

function startRenderLoop(time) {
    requestAnimationFrame(startRenderLoop);
	sceneManager.update();
	TWEEN.update(time);
}
