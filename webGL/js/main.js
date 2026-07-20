import SceneManager from './SceneManager.js';
import initSocketIO from './SocketIO.js';
import handler from './menuHandler.js';
import CampaignMenu from "./campaignMenu/CampaignMenu.js";
import EventBus from "./eventBus/EventBus.js";
import events from "./eventBus/events.js";
import LocalStorage from "./localStorage/localStorage.js";
import { initBriefing } from './missionBriefing/missionBriefing.js';
import { initDebrief } from './missionBriefing/missionDebrief.js';
import campaign from "./campaignMenu/campaign.js"; // add this import
import PilotStore from "./pilot/PilotStore.js";
import PilotScreen from "./pilot/PilotScreen.js";
import SettingsScreen from "./settings/SettingsScreen.js";
import { getMissionScore } from "./scenes/campaign/MissionObjectives.js";

initSocketIO(onKeyUp, onKeyDown);
// initial state is menu
const views = [];
function View(canvas) {
	return {
		canvas
	}
}
const canvas = document.getElementById('canvas');
const canvas2 = document.getElementById('targetComputer');

views.push(new View(canvas));
views.push(new View(canvas2));

let showMenu = false;
let campaignMenu = false;
let activeCampaignConfig = null;
let inMission = false;
let paused = false;

let sceneManager = SceneManager(views, "menu");
bindEventListeners();
startRenderLoop();

// require pilot selection before reaching the main menu, matching the
// original game's flow. SceneManager's menu-scene load is async and makes
// #menu visible on its own once it finishes — race against that by forcing
// it back to hidden for as long as the pilot gate hasn't been dismissed yet.
let pilotGateActive = true;
const menuEl = document.getElementById("menu");
const pilotGateMenuObserver = new MutationObserver(() => {
	if (pilotGateActive && menuEl.style.visibility === 'visible') {
		menuEl.style.visibility = 'hidden';
	}
});
pilotGateMenuObserver.observe(menuEl, { attributes: true, attributeFilter: ['style'] });

document.getElementById("pilot-screen").style.visibility = "visible";
PilotScreen.buildScreen();
PilotScreen.renderActivePilot();
bindEventListeners(); // re-run so the freshly-injected pilot-screen buttons get wired

// pause menu buttons are static markup, wired once — deliberately not using the
// .menu-item class (which the generic onMenuItemClick dispatch would misroute)
document.getElementById('pauseResumeBtn').addEventListener('click', resumeFromPause);
document.getElementById('pauseQuitBtn').addEventListener('click', quitToMainMenuFromPause);

EventBus.subscribe(events.MISSION_COMPLETE, () => {
	PilotStore.incrementMissionsFlown();
	const bonus = PilotStore.awardMissionCompleteBonus();
	showDebrief('success', null, getMissionScore() + bonus);
});

EventBus.subscribe(events.MISSION_FAILED, ({ reason }) => {
	PilotStore.incrementMissionsFlown();
	showDebrief('failure', reason, getMissionScore());
});

function showDebrief(result, reason, scoreEarned) {
	inMission = false;
	paused = false;
	document.getElementById('heads-up-display').style.visibility = 'hidden';

	const debriefEl = document.getElementById('mission-debrief');
	debriefEl.style.display    = 'block';
	debriefEl.style.visibility = 'visible';

	const activePilot = PilotStore.getActivePilot();
	const stats = {
		pilotName: activePilot.name,
		scoreEarned,
		totalScore: activePilot.score,
		rank: activePilot.rank,
		missionsFlown: activePilot.missionsFlown,
	};

	initDebrief(activeCampaignConfig, result, reason, stats, () => {
		debriefEl.style.display    = 'none';
		debriefEl.style.visibility = 'hidden';

		sceneManager = SceneManager(views, "menu");
		bindEventListeners();
	});
}

function isTopBarScreenVisible() {
	// campaign-menu / mission-briefing / mission-debrief all use the
	// .briefing-screen/.top-bar layout, whose content starts close enough to
	// the top that a floating corner badge collides with it (e.g. the
	// briefing's sector label) — these get the pilot name woven into their
	// existing header row instead (see below), not the floating badge.
	const campaignMenu = document.getElementById('campaign-menu');
	const briefing = document.getElementById('mission-briefing');
	const debrief = document.getElementById('mission-debrief');
	return campaignMenu.style.visibility === 'visible'
		|| briefing.style.visibility === 'visible'
		|| debrief.style.visibility === 'visible';
}

function updateActivePilotBadge() {
	const pilotScreenVisible = document.getElementById('pilot-screen').style.visibility === 'visible';
	const pilot = pilotScreenVisible ? null : PilotStore.getActivePilot();
	const pilotLabel = pilot ? (pilot.name || 'UNNAMED') : '';

	document.querySelectorAll('.top-bar .empire-logo').forEach(el => {
		el.innerHTML = pilotLabel
			? `GALACTIC EMPIRE · IMPERIAL NAVY <span class="top-bar-pilot-label">| PILOT: <span class="top-bar-pilot-name">${escapeHtml(pilotLabel)}</span></span>`
			: 'GALACTIC EMPIRE · IMPERIAL NAVY';
	});

	const badge = document.getElementById('active-pilot-badge');
	if (!badge) return;
	if (!pilotLabel || isTopBarScreenVisible()) {
		badge.style.visibility = 'hidden';
		return;
	}
	badge.innerHTML = `PILOT: <span class="active-pilot-badge-name">${escapeHtml(pilotLabel)}</span>`;
	badge.style.visibility = 'visible';
}

function escapeHtml(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}

function bindEventListeners() {
	updateActivePilotBadge();
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

	// ship select arrows
	const arrowLeft  = document.getElementById('arrowLeft');
	const arrowRight = document.getElementById('arrowRight');
	if (arrowLeft)  arrowLeft.onclick  = () => sceneManager.onKeyDown(37, 1000);
	if (arrowRight) arrowRight.onclick = () => sceneManager.onKeyDown(39, 1000);

	resizeCanvas();
}

function resizeCanvas() {
	for(let i = 0; i < views.length; ++i) {
		if(i===0){
			views[i].canvas.style.width = '100%';
			views[i].canvas.style.height= '100%';
		}

		views[i].canvas.width  = views[i].canvas.offsetWidth;
		views[i].canvas.height = views[i].canvas.offsetHeight;

		sceneManager.onWindowResize();
	}

	// sync overlay to exact game canvas pixel size
	const overlay = document.getElementById('reticle-overlay');
	if (overlay) {
		overlay.width  = views[0].canvas.width;
		overlay.height = views[0].canvas.height;
	}
}

function onMenuItemClick(event) {
	// clear canvas
	const canvas = document.getElementById('canvas');
	canvas.innerHTML = "";

	const menuItem = event.currentTarget.getAttribute("name");
	if(menuItem === "shipselect"){
		// hide btn container
		const btnContainer = document.getElementById("btn-container");
		btnContainer.style.visibility = "visible";

		// hide main menu
		const menu = document.getElementById("menu");
		menu.style.visibility = "hidden";

		// clear canvas
		const canvas = document.getElementById('canvas');
		canvas.innerHTML = "";

		campaignMenu = false;

		// show subMenu
		const subMenu = document.getElementById("sub-menu");
		subMenu.style.visibility = "visible";
		document.getElementById('ship-select-arrows').style.display = 'flex';
	} else if(menuItem === "pilot") {
		// hide main menu, show pilot screen and rebind listeners (so the
		// freshly-injected pilot-screen buttons get wired), but skip the
		// SceneManager call below — "pilot" isn't a valid scene key, and
		// skipping it lets the menu's 3D background keep animating underneath,
		// same trick showMissionBriefing() uses
		document.getElementById("menu").style.visibility = "hidden";
		document.getElementById("pilot-screen").style.visibility = "visible";
		PilotScreen.buildScreen();
		PilotScreen.renderActivePilot();
		bindEventListeners();
		return;
	} else if(menuItem === "settings") {
		// same DOM-overlay trick as "pilot" above — not a valid scene key,
		// skip the SceneManager call so the menu's 3D background keeps animating
		document.getElementById("menu").style.visibility = "hidden";
		document.getElementById("settings-screen").style.visibility = "visible";
		SettingsScreen.buildScreen();
		SettingsScreen.renderSettings();
		bindEventListeners();
		return;
	} else {
		// hide main menu
		const menu = document.getElementById("menu");
		menu.style.visibility = "hidden";

		const hudElem = document.getElementById('heads-up-display');
		hudElem.style.visibility = 'hidden';

		// show campaign-menu
		const subMenu = document.getElementById("campaign-menu");
		subMenu.style.visibility = "visible";
		campaignMenu = true;
		CampaignMenu.buildMenu();
	}
	// load scene
	sceneManager = SceneManager(views, menuItem);
	bindEventListeners();
}

function onSubMenuItemClick(event) {
	const subMenuItem = event.currentTarget.getAttribute("name");
	console.log(`sub menu item: ${subMenuItem}`);
	const mission = subMenuItem.search("mission");
	console.log(`has mission? ${mission}`);
	if(subMenuItem === "shipselect"){
		// clear canvas
		const canvas = document.getElementById('canvas');
		canvas.innerHTML = "";

		// show btn container
		const element = document.getElementById("btn-container");
		element.style.visibility = "visible";

		const loadingElem = document.getElementById('loading');
		loadingElem.style.visibility = 'visible';

		document.getElementById('ship-select-arrows').style.display = 'flex';

		// load scene
		sceneManager = SceneManager(views, subMenuItem);
		bindEventListeners();
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

		document.getElementById('ship-select-arrows').style.display = 'none';

        document.getElementById("start").disabled = true;

		// load scene
		sceneManager = SceneManager(views, "multiplayer");
		bindEventListeners();
        handler.startGame();
        inMission = true;
	} else if(subMenuItem === "connect") {
		// const element3 = document.getElementById("start");
		// element3.style.disabled = false;
        document.getElementById("leaveServer").disabled = false;
        document.getElementById("connect").disabled = true;
        document.getElementById("selectBtn").disabled = false;
		handler.connectToServer();
	} else if(subMenuItem === "pilotnew") {
		PilotScreen.createNewPilot();
	} else if(subMenuItem === "leaveserver") {
		// clear canvas
		const canvas = document.getElementById('canvas');
		canvas.innerHTML = "";

		inMission = false;
		paused = false;
		document.getElementById('pause-menu').style.visibility = 'hidden';

		const element2 = document.getElementById("menu");
		element2.style.visibility = "hidden";

		const hudElem = document.getElementById('heads-up-display');
		hudElem.style.visibility = 'hidden';

		const room = LocalStorage.getItem("SOCKET_ROOM");
		EventBus.post(events.LEAVE_ROOM, room);

		// show btn container
		const element = document.getElementById("btn-container");
		element.style.visibility = "visible";

        document.getElementById("connect").disabled = false;
        document.getElementById("selectBtn").disabled = true;
        document.getElementById("leaveServer").disabled = true;

		const loadingElem = document.getElementById('loading');
		loadingElem.style.visibility = 'visible';

		document.getElementById('ship-select-arrows').style.display = 'flex';

		// load scene
		sceneManager = SceneManager(views, "shipselect");
		bindEventListeners();
	} else if(subMenuItem === "back") {
		const canvas = document.getElementById('canvas');
		canvas.innerHTML = "";

		// once the player has dismissed the pilot gate (via any "back" button,
		// including the pilot screen's own CONTINUE), stop forcing #menu hidden
		pilotGateActive = false;
		pilotGateMenuObserver.disconnect();

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

		const element6 = document.getElementById("campaign-menu");
		element6.style.visibility = "hidden";

		document.getElementById("pilot-screen").style.visibility = "hidden";
		document.getElementById("settings-screen").style.visibility = "hidden";

		const loadingElem = document.getElementById('loading');
		loadingElem.style.visibility = 'visible';

		const hudElem = document.getElementById('heads-up-display');
		hudElem.style.visibility = 'hidden';

		document.getElementById('ship-select-arrows').style.display = 'none';

		sceneManager = SceneManager(views, "menu");
		bindEventListeners();
	} else if (mission > -1) {
		// hide all except menu
		const element  = document.getElementById("btn-container");
		const element2 = document.getElementById("menu");
		const element3 = document.getElementById("sub-menu");
		const element4 = document.getElementById("shipInfo");
		const element5 = document.getElementById("shipInfoLeft");
		const element6 = document.getElementById("campaign-menu");
		const loadingElem = document.getElementById('loading');

		element.style.visibility  = "hidden";
		element2.style.visibility = "hidden";
		element3.style.visibility = "hidden";
		element4.style.visibility = "hidden";
		element5.style.visibility = "hidden";
		element6.style.visibility = "hidden";
		loadingElem.style.visibility = "hidden";

		showMissionBriefing(subMenuItem);
	}
}

function showMissionBriefing(missionKey) {
	const briefingEl = document.getElementById('mission-briefing');
	briefingEl.style.display    = 'block';
	briefingEl.style.visibility = 'visible';
	briefingEl.style.zIndex     = '2000';

	// pass campaign config for this mission to initBriefing
	const campaignConfig = campaign[missionKey];
	activeCampaignConfig = campaignConfig;

	initBriefing(campaignConfig, () => {
		briefingEl.style.display    = 'none';
		briefingEl.style.visibility = 'hidden';
		briefingEl.style.zIndex     = '-1';

		document.getElementById('heads-up-display').style.visibility = 'visible';
		inMission = true;

		sceneManager = SceneManager(views, missionKey);
		bindEventListeners();
	});
}

function togglePauseMenu() {
	paused = !paused;
	document.getElementById('pause-menu').style.visibility = paused ? 'visible' : 'hidden';
}

function resumeFromPause() {
	paused = false;
	document.getElementById('pause-menu').style.visibility = 'hidden';
}

function quitToMainMenuFromPause() {
	inMission = false;
	paused = false;
	document.getElementById('pause-menu').style.visibility = 'hidden';
	document.getElementById('heads-up-display').style.visibility = 'hidden';

	const canvas = document.getElementById('canvas');
	canvas.innerHTML = "";

	sceneManager = SceneManager(views, "menu");
	bindEventListeners();
}

function isMainMenuAreaVisible() {
	return document.getElementById('menu').style.visibility === 'visible'
		|| document.getElementById('pilot-screen').style.visibility === 'visible'
		|| document.getElementById('settings-screen').style.visibility === 'visible';
}

function onKeyDown(event, duration) {
	if(event.keyCode === 27){
		// during actual gameplay (campaign mission or multiplayer match), Esc
		// opens a dedicated pause menu instead of the Battle/Campaign-select or
		// ship-select screens — those don't make sense to land on mid-flight
		if(inMission){
			togglePauseMenu();
			return;
		}

		// the sub-menu/campaign-menu toggle below is only meaningful while actually
		// inside the ship-select or campaign-select flow — on the main menu, pilot
		// screen, or settings screen there's nothing for Esc to show, so bail out
		// rather than have stale showMenu/campaignMenu state pop up an unrelated menu
		if(isMainMenuAreaVisible()) return;

		const element3 = document.getElementById("sub-menu");
		// show menu
		if(showMenu && !campaignMenu){
			element3.style.visibility = "visible";
			showMenu = false;
		} else if(!showMenu && !campaignMenu) {
			element3.style.visibility = "hidden";
			showMenu = true;
		}
		const element = document.getElementById("campaign-menu");
		// show campaign menu
		if(showMenu && campaignMenu){
			element.style.visibility = "visible";
			showMenu = false;
		} else if(!showMenu && campaignMenu) {
			element.style.visibility = "hidden";
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
	if(!paused) sceneManager.update();
	TWEEN.update(time);
}
