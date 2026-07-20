import SettingsStore from "./SettingsStore.js";
import { updateVolumes, playSound } from "../utils/Audio.js";

// short, punchy SFX sample used to preview the current sound-effects volume —
// music doesn't need this since the already-playing track is its own live
// feedback as the slider moves, but SFX has nothing playing to reveal the
// level unless we trigger something
const SFX_PREVIEW_SOUND = "BLAST";

let built = false;

export function buildScreen() {
    if (built) return;
    built = true;

    const container = document.getElementById('settings-screen');
    container.innerHTML = `
        <div class="menu">
            <div class="menu-title">SETTINGS</div>

            <div class="settings-panels">
                <div class="panel settings-panel" id="musicSettingsPanel">
                    <div class="panel-title">MUSIC</div>
                    <div class="settings-row">
                        <span class="settings-row-label">MUSIC</span>
                        <button id="musicToggleBtn" class="settings-toggle-btn"></button>
                    </div>
                    <div class="settings-row settings-row-slider">
                        <input type="range" id="musicVolumeSlider" class="settings-slider" min="0" max="100" step="1" />
                        <span class="settings-volume-readout" id="musicVolumeReadout"></span>
                    </div>
                </div>

                <div class="panel settings-panel" id="sfxSettingsPanel">
                    <div class="panel-title">SOUND EFFECTS</div>
                    <div class="settings-row">
                        <span class="settings-row-label">SOUND FX</span>
                        <button id="sfxToggleBtn" class="settings-toggle-btn"></button>
                    </div>
                    <div class="settings-row settings-row-slider">
                        <input type="range" id="sfxVolumeSlider" class="settings-slider" min="0" max="100" step="1" />
                        <span class="settings-volume-readout" id="sfxVolumeReadout"></span>
                    </div>
                </div>
            </div>

            <div class="settings-actions">
                <button id="settingsBackBtn" class="nav-btn launch sub-menu-item" name="back">BACK ►</button>
            </div>
        </div>
    `;

    document.getElementById('musicToggleBtn').addEventListener('click', () => {
        SettingsStore.setMusicEnabled(!SettingsStore.getSettings().musicEnabled);
        applySettings();
    });
    document.getElementById('sfxToggleBtn').addEventListener('click', () => {
        const nowEnabled = !SettingsStore.getSettings().sfxEnabled;
        SettingsStore.setSfxEnabled(nowEnabled);
        applySettings();
        if (nowEnabled) playSound(SFX_PREVIEW_SOUND, null);
    });
    document.getElementById('musicVolumeSlider').addEventListener('input', (e) => {
        SettingsStore.setMusicVolumePct(Number(e.target.value));
        applySettings();
    });
    document.getElementById('sfxVolumeSlider').addEventListener('input', (e) => {
        SettingsStore.setSfxVolumePct(Number(e.target.value));
        applySettings();
    });
    // preview once per commit (mouse release / arrow-key press) rather than on
    // every 'input' tick, so dragging doesn't machine-gun the sample
    document.getElementById('sfxVolumeSlider').addEventListener('change', () => {
        if (SettingsStore.getSettings().sfxEnabled) playSound(SFX_PREVIEW_SOUND, null);
    });
}

function applySettings() {
    updateVolumes(SettingsStore.getAudioConfig());
    renderSettings();
}

export function renderSettings() {
    const settings = SettingsStore.getSettings();

    setToggle('musicToggleBtn', settings.musicEnabled);
    setToggle('sfxToggleBtn', settings.sfxEnabled);

    document.getElementById('musicVolumeSlider').value = settings.musicVolumePct;
    document.getElementById('musicVolumeReadout').textContent = `${settings.musicVolumePct}%`;
    document.getElementById('sfxVolumeSlider').value = settings.sfxVolumePct;
    document.getElementById('sfxVolumeReadout').textContent = `${settings.sfxVolumePct}%`;

    document.getElementById('musicSettingsPanel').setAttribute('data-enabled', settings.musicEnabled);
    document.getElementById('sfxSettingsPanel').setAttribute('data-enabled', settings.sfxEnabled);
}

function setToggle(id, enabled) {
    const btn = document.getElementById(id);
    btn.textContent = enabled ? 'ON' : 'OFF';
    btn.classList.toggle('is-off', !enabled);
}

export default { buildScreen, renderSettings };
