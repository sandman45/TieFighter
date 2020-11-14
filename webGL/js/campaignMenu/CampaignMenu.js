
import campaign from "./campaign.js";

function buildMenu() {
    const element = document.getElementById("campaign-menu");
    Object.keys(campaign).forEach(mission => {
        // create a menu item for each mission
        const menuItem = `<button id="${mission}" class="sub-menu-item" name="${mission}">${campaign[mission].menuName}</button>`;
        element.innerHTML += menuItem;
    });
}

export default {
    buildMenu,
}
