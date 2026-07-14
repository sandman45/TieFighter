export function initDebrief(campaignConfig, result, reason, stats, onReturnToMenu) {
    const titleEl  = document.getElementById('debrief-mission-title');
    const headerEl = document.getElementById('debrief-result-header');
    const textEl   = document.getElementById('debrief-text');
    const pilotNameEl     = document.getElementById('debrief-pilot-name');
    const pilotCallsignEl = document.getElementById('debrief-pilot-callsign');
    const scoreEarnedEl   = document.getElementById('debrief-score-earned');
    const totalScoreEl    = document.getElementById('debrief-total-score');
    const rankEl           = document.getElementById('debrief-rank');
    const missionsFlownEl = document.getElementById('debrief-missions-flown');

    if(titleEl) titleEl.textContent = campaignConfig.title;
    if(pilotCallsignEl) pilotCallsignEl.textContent = (campaignConfig.player.designation || '').replace(/_/g, ' ');

    if(stats) {
        if(pilotNameEl)     pilotNameEl.textContent     = stats.pilotName;
        if(scoreEarnedEl)   scoreEarnedEl.textContent   = `+${stats.scoreEarned ?? 0}`;
        if(totalScoreEl)    totalScoreEl.textContent    = stats.totalScore ?? '—';
        if(rankEl)          rankEl.textContent          = stats.rank ?? '—';
        if(missionsFlownEl) missionsFlownEl.textContent = stats.missionsFlown ?? '—';
    }

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
