import EventBus from "./eventBus/EventBus.js";
import events from "./eventBus/events.js";
import LocalStorage from "./localStorage/localStorage.js";

function btnClickFromMenu(event, sceneManager) {
    const subMenuItem = event.currentTarget.getAttribute("value");
    console.log(`sub menu item: ${subMenuItem}`);

    // select ship
    if(subMenuItem === "select"){
        const selection = LocalStorage.getItem("SELECTED_SHIP");
        const room = LocalStorage.getItem("SOCKET_ROOM");
        console.log(`${selection} selected.`);
        document.getElementById("start").disabled = false;
        EventBus.post(events.PLAYER_SELECTION_READY, {
            selection,
            room: room,
        });
    } else {
        sceneManager.btnClickFromMenu(subMenuItem);
    }
}

function onSubMenuItemClick(event) {
    const subMenuItem = event.currentTarget.getAttribute("name");
    console.log(`sub menu item: ${subMenuItem}`);
}

function connectToServer() {
    // const room = document.getElementById("serverRoom").getAttribute("value");
    const room = "Game";
    console.log(`joined => ${room}`);
    LocalStorage.setItem("SOCKET_ROOM", room);
    EventBus.post(events.JOIN_ROOM, room);
}

function startGame() {
    console.log('Connect button clicked');
    //TODO: double check room, player selection and connection etc
    const room = LocalStorage.getItem("SOCKET_ROOM");
    EventBus.post(events.START_GAME, room);
}

function pilotName() {
    const pilot = document.getElementById("pilotName").getAttribute("value");
    console.log(`Set ${pilot} as Pilot Name`);
    LocalStorage.setItem("PILOT_NAME", pilot);
}

function currentSelectionInView() {
    EventBus.subscribe(events.SHIP_SELECTION_CHANGE, d => {
        console.log(`${events.SHIP_SELECTION_CHANGE} to ${d}`);
        LocalStorage.setItem("SELECTED_SHIP", d);
    });
}


export default {
    currentSelectionInView,
    connectToServer,
    pilotName,
    startGame,
    onSubMenuItemClick,
    btnClickFromMenu
}
