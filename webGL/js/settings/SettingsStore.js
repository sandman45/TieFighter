import LocalStorage from "../localStorage/localStorage.js";
import sceneConfig from "../../sceneConfig.js";

const SETTINGS_KEY = "AUDIO_SETTINGS";

const DEFAULTS = {
    musicEnabled: true,
    musicVolumePct: 50,
    sfxEnabled: true,
    sfxVolumePct: 50,
};

function getSettings() {
    return { ...DEFAULTS, ...LocalStorage.getItem(SETTINGS_KEY) };
}

function writeSettings(patch) {
    LocalStorage.setItem(SETTINGS_KEY, { ...getSettings(), ...patch });
}

function setMusicEnabled(enabled) {
    writeSettings({ musicEnabled: enabled });
}

function setMusicVolumePct(pct) {
    writeSettings({ musicVolumePct: pct });
}

function setSfxEnabled(enabled) {
    writeSettings({ sfxEnabled: enabled });
}

function setSfxVolumePct(pct) {
    writeSettings({ sfxVolumePct: pct });
}

// Resolves the player's stored settings into the {music, musicVolume, sfx,
// sfxVolume} shape GameAudio() expects, scaling sceneConfig.js's tuned
// default gains (the "100%" ceiling) by the chosen percentage rather than
// hardcoding a second set of volume numbers here.
function getAudioConfig() {
    const settings = getSettings();
    const { musicVolume: musicCeiling, sfxVolume: sfxCeiling } = sceneConfig.audio;
    return {
        music: settings.musicEnabled,
        musicVolume: musicCeiling * (settings.musicVolumePct / 100),
        sfx: settings.sfxEnabled,
        sfxVolume: sfxCeiling * (settings.sfxVolumePct / 100),
    };
}

export default {
    getSettings,
    setMusicEnabled,
    setMusicVolumePct,
    setSfxEnabled,
    setSfxVolumePct,
    getAudioConfig,
};
