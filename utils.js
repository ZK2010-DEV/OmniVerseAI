// utils.js
export function saveSettings(settings) {
    localStorage.setItem('omniVerseAiSettings', JSON.stringify(settings));
}

export function loadSettings(settingsObject) {
    const savedSettings = localStorage.getItem('omniVerseAiSettings');
    if (savedSettings) {
        Object.assign(settingsObject, JSON.parse(savedSettings));
    }
}