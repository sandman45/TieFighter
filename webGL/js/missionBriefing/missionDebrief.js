export function initDebrief(campaignConfig, result, reason, onReturnToMenu) {
    const titleEl  = document.getElementById('debrief-mission-title');
    const headerEl = document.getElementById('debrief-result-header');
    const textEl   = document.getElementById('debrief-text');

    if(titleEl) titleEl.textContent = campaignConfig.title;

    if(result === 'success') {
        if(headerEl) {
            headerEl.textContent = 'MISSION SUCCESSFUL';
            headerEl.classList.remove('failure');
            headerEl.classList.add('success');
        }
        if(textEl) {
            const paragraphs = (campaignConfig.aftermath || '').split(/\n+/).filter(p => p.trim().length > 0);
            textEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
        }
    } else {
        if(headerEl) {
            headerEl.textContent = 'MISSION FAILED';
            headerEl.classList.remove('success');
            headerEl.classList.add('failure');
        }
        if(textEl) {
            textEl.innerHTML = `<p>${reason || 'The mission could not be completed.'}</p>`;
        }
    }

    // remove old listener by replacing the button with a clone (matches missionBriefing.js pattern)
    const returnBtn = document.getElementById('debriefReturnBtn');
    const freshBtn = returnBtn.cloneNode(true);
    returnBtn.replaceWith(freshBtn);
    freshBtn.addEventListener('click', () => {
        if(typeof onReturnToMenu === 'function') onReturnToMenu();
    });
}
