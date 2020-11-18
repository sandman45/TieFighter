
import campaign from "./campaign.js";

function buildMenu() {
    const element = document.getElementById("campaign-menu");
    element.innerHTML = "";
    element.innerHTML += `<button id="mainMenu" class="sub-menu-item" name="back">Main Menu</button>`;
    Object.keys(campaign).forEach(mission => {
        // create a menu item for each mission
        if(campaign[mission].active){
            const menuItem = `<button id="${mission}" class="sub-menu-item" name="${mission}">${campaign[mission].menuName}</button>`;
            element.innerHTML += menuItem;
        }
    });
}

export default {
    buildMenu,
}
