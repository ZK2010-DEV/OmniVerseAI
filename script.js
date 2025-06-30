import { saveSettings, loadSettings } from './utils.js';
import { 
    initializeUI, 
    addMessage, 
    updateUserInfoDisplay, 
    toggleSettingsPanel, 
    updateSidebarActiveLink, 
    toggleTypingIndicator, 
    toggleSendButton,
    speakMessage,
    toggleTheme 
} from './ui.js';
import { 
    initializeWebsimData, 
    loadUserProfileFromDB, 
    saveUserProfileDataToDB, 
    loadPastMessagesFromDB, 
    deleteModuleMemoryFromDB 
} from './websim_data.js';
import { OMNI_AI_PROMPT, OMNI_AI_GREETING_PROMPT, processUserRequest, generateModuleGreeting } from './ai_service.js';
import { attachEventListeners } from './event_handlers.js';

// Global instances and state
export const room = new WebsimSocket(); // Initialize WebsimSocket globally

export let currentUser; // Stores the current Websim user (from websim.getCurrentUser())
export let currentUserProfileData = { // This will hold the consolidated profile data from our records
    id: null, // The record ID in WebsimSocket (if profile exists)
    userId: null, // The Websim user ID
    customDisplayName: null,
    avatarUrl: null
};
export let conversationHistory = []; // Used for short-term memory when long-term is off
export let attachedFile = null; // Stores file info after upload, before message is sent

export let loadingSound; // Declare for the sound effect

// Default settings
export let settings = {
    persona: 'Friendly',
    voice: 'en-male',
    responseTone: 'default',
    longTermMemory: false,
    customInstructions: '',
    // New settings defaults
    enableVoiceResponses: true,
    enableImageLabModule: true,
    enableMusicStudioModule: true,
    enableVoiceBotModule: true,
    enableRoleplaySimulatorModule: true,
    enableDocumentsModule: true,
    enableAutoAgentsModule: true,
    enableCodeLabModule: true,
    offlineMode: false,
    customVoiceCommands: '',
    customChatShortcuts: '',
};

export let currentActiveModule = 'chat'; // Default active module

// --- Core Application Logic ---

// Function to encapsulate the main app initialization logic that needs to run after audio is enabled
async function initializeAppContent() {
    loadSettings(settings); // Load settings into the global settings object

    currentUser = await websim.getCurrentUser(); // Use websim.getCurrentUser()
    if (currentUser) {
        currentUserProfileData.userId = currentUser.id; // Ensure userId is set before loading/saving
    }
    
    await loadUserProfileFromDB(currentUser, currentUserProfileData); // Load custom profile if exists

    // Initialize UI components with loaded data
    initializeUI(settings); // Pass settings for initial UI setup like theme

    // IMPORTANT: On initial app load, always start with a clean slate for the chat module
    currentActiveModule = 'chat'; // Set initial module to 'chat'
    updateSidebarActiveLink(currentActiveModule); // Set active sidebar link for 'chat'

    // Generate the initial AI greeting for the 'chat' module (always a fresh start)
    await generateModuleGreeting({
        moduleName: 'chat',
        addMessage,
        speakMessage,
        toggleTypingIndicator,
        toggleSendButton,
        settings,
        conversationHistory // Pass for potential logging or immediate history update
    });
    
    // Hide loading screen and show main layout
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('main-layout').classList.remove('hidden');

    // Stop loading sound after main content is visible
    if (loadingSound) {
        loadingSound.pause();
        loadingSound.currentTime = 0;
    }
}

// Function to set active module and update UI and generate greeting
export async function setActiveModule(moduleName) {
    currentActiveModule = moduleName;

    updateSidebarActiveLink(moduleName);

    // Always clear chat messages and local history when switching modules
    // This gives the "new chat begins" experience by default
    document.getElementById('message-list').innerHTML = '';
    conversationHistory = []; 

    // Generate an AI greeting/instruction specific to the module, which will appear on a fresh display
    generateModuleGreeting({
        moduleName,
        addMessage,
        speakMessage,
        toggleTypingIndicator,
        toggleSendButton,
        settings,
        conversationHistory
    });
}

// Initial setup on load
window.addEventListener('load', async () => {
    loadingSound = new Audio('./loading_sound.mp3');
    loadingSound.loop = true;
    loadingSound.volume = 0.7;
    const audioEnablePrompt = document.getElementById('audio-enable-prompt');
    const loadingScreen = document.getElementById('loading-screen');

    try {
        await loadingSound.play();
        // If play() succeeds (e.g., in an environment that allows autoplay), proceed
        initializeAppContent();
    } catch (e) {
        console.warn("Loading sound autoplay blocked, requesting user interaction:", e);
        audioEnablePrompt.classList.remove('hidden'); // Show prompt for user interaction

        // Wait for user interaction on the loading screen itself
        loadingScreen.addEventListener('click', async function handleFirstClick() {
            loadingScreen.removeEventListener('click', handleFirstClick); // Remove listener after first click
            audioEnablePrompt.classList.add('hidden'); // Hide prompt

            try {
                await loadingSound.play(); // This play() should now succeed due to user gesture
            } catch (err) {
                console.error("Failed to play loading sound after user click:", err);
            }
            initializeAppContent(); // Proceed with app initialization
        }, { once: true }); // Ensure this listener is only called once
    }

    // Attach all event listeners after initial DOM is ready
    attachEventListeners({
        // Pass necessary global/module state and functions to event handlers
        room,
        currentUser,
        currentUserProfileData,
        settings,
        conversationHistory,
        attachedFile, // Pass the mutable variable
        updateAttachedFile: (fileInfo) => { attachedFile = fileInfo; }, // Setter for attachedFile
        currentActiveModule: () => currentActiveModule, // Pass as function to get latest value
        updateCurrentActiveModule: (moduleName) => { currentActiveModule = moduleName; },
        addMessage,
        speakMessage,
        toggleTypingIndicator,
        toggleSendButton,
        saveSettings,
        saveUserProfileDataToDB,
        loadPastMessagesFromDB,
        deleteModuleMemoryFromDB,
        processUserRequest,
        generateModuleGreeting,
        updateUserInfoDisplay,
        toggleTheme,
        setActiveModule, // Pass for sidebar clicks
        toggleSettingsPanel
    });

    // Initialize Websim data module (e.g., for subscriptions)
    initializeWebsimData(room);
});