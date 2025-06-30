// ui.js - Handles all DOM manipulation and UI rendering
import { speakMessage as _speakMessage } from './ui.js'; // Self-reference for internal use or breaking circular if needed

// DOM Elements (cached after initialization)
const DOM = {};
let lastActiveElement = null; // To store the element that was focused before opening settings

export function initializeUI(settings) {
    DOM.loadingScreen = document.getElementById('loading-screen');
    DOM.audioEnablePrompt = document.getElementById('audio-enable-prompt');
    DOM.mainLayout = document.getElementById('main-layout');
    DOM.messageList = document.getElementById('message-list');
    DOM.typingIndicator = document.getElementById('typing-indicator');
    DOM.sendButton = document.getElementById('send-button');
    DOM.userGreetingSpan = document.querySelector('.user-greeting');
    DOM.userAvatarImg = document.querySelector('.user-avatar');
    DOM.themeToggle = document.getElementById('theme-toggle');
    DOM.settingsPanel = document.getElementById('settings-panel');
    DOM.personaSelect = document.getElementById('persona-select');
    DOM.voiceSelect = document.getElementById('voice-select');
    DOM.responseToneSelect = document.getElementById('response-tone-select');
    DOM.longTermMemoryToggle = document.getElementById('long-term-memory-toggle');
    DOM.customInstructionsInput = document.getElementById('custom-instructions');
    DOM.settingsUsernameDisplay = document.getElementById('settings-username-display');
    DOM.usernameInput = document.getElementById('username-input');
    DOM.closeSettingsButton = document.getElementById('close-settings-button'); // Add close button to DOM cache
    // File upload elements
    DOM.fileUploadInput = document.getElementById('file-upload-input');
    DOM.attachFileButton = document.getElementById('attach-file-button');
    // New settings DOM elements
    DOM.aiVoiceResponsesToggle = document.getElementById('ai-voice-responses-toggle');
    DOM.enableImageLabToggle = document.getElementById('enable-image-lab-toggle');
    DOM.enableMusicStudioToggle = document.getElementById('enable-music-studio-toggle');
    DOM.enableVoiceBotToggle = document.getElementById('enable-voice-bot-toggle');
    DOM.enableRoleplaySimulatorToggle = document.getElementById('enable-roleplay-simulator-toggle'); // Corrected ID
    DOM.enableDocumentsToggle = document.getElementById('enable-documents-toggle');
    DOM.enableAutoAgentsToggle = document.getElementById('enable-auto-agents-toggle');
    DOM.enableCodeLabToggle = document.getElementById('enable-code-lab-toggle');
    DOM.offlineModeToggle = document.getElementById('offline-mode-toggle');
    DOM.customVoiceCommandsInput = document.getElementById('custom-voice-commands');
    DOM.customChatShortcutsInput = document.getElementById('custom-chat-shortcuts');

    // Apply loaded settings to UI on startup
    DOM.personaSelect.value = settings.persona;
    DOM.voiceSelect.value = settings.voice;
    DOM.responseToneSelect.value = settings.responseTone;
    DOM.longTermMemoryToggle.checked = settings.longTermMemory;
    DOM.customInstructionsInput.value = settings.customInstructions;
    // Apply new settings
    DOM.aiVoiceResponsesToggle.checked = settings.enableVoiceResponses;
    DOM.enableImageLabToggle.checked = settings.enableImageLabModule;
    DOM.enableMusicStudioToggle.checked = settings.enableMusicStudioModule;
    DOM.enableVoiceBotToggle.checked = settings.enableVoiceBotModule;
    DOM.enableRoleplaySimulatorToggle.checked = settings.enableRoleplaySimulatorModule;
    DOM.enableDocumentsToggle.checked = settings.enableDocumentsModule;
    DOM.enableAutoAgentsToggle.checked = settings.enableAutoAgentsModule;
    DOM.enableCodeLabToggle.checked = settings.enableCodeLabModule;
    DOM.offlineModeToggle.checked = settings.offlineMode;
    DOM.customVoiceCommandsInput.value = settings.customVoiceCommands;
    DOM.customChatShortcutsInput.value = settings.customChatProtocols;

    // Set initial theme toggle state
    if (document.body.classList.contains('light-theme')) {
        DOM.themeToggle.textContent = '🌙';
    } else {
        DOM.themeToggle.textContent = '☀️';
    }
}

// Function to add message to UI
export function addMessage(sender, messageContent, type = 'text', url = null, captionOrFileName = null, fileType = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    // Add text content if available
    if (messageContent) {
        // Naive check for code blocks
        if (messageContent.includes('```')) {
            messageDiv.innerHTML = messageContent.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        } else {
            messageDiv.textContent = messageContent;
        }
    }

    if (type === 'image' && url) {
        // For image type, add image element
        const image = document.createElement('img');
        image.src = url;
        image.alt = captionOrFileName || `Generated image for ${sender} message`;
        messageDiv.appendChild(image);
        // If there was also text content, ensure it's above the image, or handle as a caption
        if (messageContent && sender === 'ai' && !captionOrFileName) {
            // If AI message has text *and* an image, and no explicit caption, use the text as main content
            // The AI should ideally send caption via captionOrFileName
        }
    } else if (type === 'file' && url) {
        // For file type, add a file attachment container
        const fileContainer = document.createElement('div');
        fileContainer.classList.add('file-attachment-container');
        
        // Add file icon (reusing existing SVG path)
        const fileIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        fileIcon.setAttribute("viewBox", "0 0 24 24");
        fileIcon.setAttribute("width", "20");
        fileIcon.setAttribute("height", "20");
        fileIcon.setAttribute("fill", "currentColor");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2ZM18 20V9H13V4L18 20Z");
        fileIcon.appendChild(path);
        fileContainer.appendChild(fileIcon);

        const fileLink = document.createElement('a');
        fileLink.href = url;
        fileLink.textContent = captionOrFileName || 'Uploaded File';
        fileLink.target = '_blank';
        fileLink.download = captionOrFileName || 'download'; // Suggest download filename
        fileLink.classList.add('file-attachment-link');
        fileContainer.appendChild(fileLink);
        
        const fileInfoText = document.createElement('span');
        fileInfoText.textContent = ` (${fileType || 'unknown'})`;
        fileInfoText.classList.add('file-info-text');
        fileContainer.appendChild(fileInfoText);

        messageDiv.appendChild(fileContainer);
    }

    DOM.messageList.appendChild(messageDiv);
    DOM.messageList.scrollTop = DOM.messageList.scrollHeight;
}

// Function to speak message using websim.textToSpeech
export async function speakMessage(text, voiceSetting) {
    // Only speak if AI voice responses are enabled in settings
    if (DOM.aiVoiceResponsesToggle.checked && text && voiceSetting && voiceSetting !== 'none') {
        try {
            const result = await websim.textToSpeech({
                text: text,
                voice: voiceSetting,
            });
            const audio = new Audio(result.url);
            audio.play();
        } catch (error) {
            console.error('Error playing speech:', error);
        }
    }
}

export function updateUserInfoDisplay(currentUser, currentUserProfileData) {
    const defaultUsername = "Guest";
    const defaultAvatarUrl = "https://images.websim.com/avatar/default_user";

    const displayUsername = currentUserProfileData.customDisplayName || (currentUser ? currentUser.username : defaultUsername);
    const displayAvatarUrl = currentUserProfileData.avatarUrl || (currentUser ? `https://images.websim.com/avatar/${currentUser.username}` : defaultAvatarUrl);

    if (DOM.userGreetingSpan) {
        DOM.userGreetingSpan.textContent = `Welcome, @${displayUsername}!`;
    }
    if (DOM.usernameInput) {
        DOM.usernameInput.value = displayUsername;
    }
    if (DOM.userAvatarImg) {
        DOM.userAvatarImg.src = displayAvatarUrl;
        DOM.userAvatarImg.alt = `${displayUsername}'s avatar`; // Update alt text
    }
    if (DOM.settingsUsernameDisplay) {
        DOM.settingsUsernameDisplay.textContent = currentUser ? `@${currentUser.username}` : `Guest (Login to save profile)`;
    }
}

export function toggleSettingsPanel(show) {
    if (show) {
        lastActiveElement = document.activeElement; // Save currently focused element
        DOM.settingsPanel.classList.add('active');
        DOM.settingsPanel.setAttribute('aria-hidden', 'false'); // Make visible to screen readers
        DOM.closeSettingsButton.focus(); // Focus on the close button when opened
        // Optionally, trap focus within the modal for full accessibility
    } else {
        DOM.settingsPanel.classList.remove('active');
        DOM.settingsPanel.setAttribute('aria-hidden', 'true'); // Hide from screen readers
        if (lastActiveElement) {
            lastActiveElement.focus(); // Restore focus to the element that opened the panel
        }
    }
}

export function updateSidebarActiveLink(moduleName) {
    document.querySelectorAll('#sidebar ul li a').forEach(link => {
        if (link.dataset.module === moduleName) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page'); // Indicate current active page
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

export function toggleTypingIndicator(show) {
    if (show) {
        DOM.typingIndicator.classList.remove('hidden');
        DOM.typingIndicator.setAttribute('aria-hidden', 'false');
    } else {
        DOM.typingIndicator.classList.add('hidden');
        DOM.typingIndicator.setAttribute('aria-hidden', 'true');
    }
}

export function toggleSendButton(disabled) {
    DOM.sendButton.disabled = disabled;
    DOM.sendButton.setAttribute('aria-disabled', disabled);
}

export function toggleTheme() {
    document.body.classList.toggle('light-theme');
    if (document.body.classList.contains('light-theme')) {
        DOM.themeToggle.textContent = '🌙';
        DOM.themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    } else {
        DOM.themeToggle.textContent = '☀️';
        DOM.themeToggle.setAttribute('aria-label', 'Switch to light theme');
    }
}