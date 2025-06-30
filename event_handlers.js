// event_handlers.js - Centralizes all event listener callbacks
import { addMessage, toggleTypingIndicator, toggleSendButton, speakMessage, updateUserInfoDisplay, toggleTheme, toggleSettingsPanel } from './ui.js';
import { saveSettings } from './utils.js';
import { saveMessageToDB, saveUserProfileDataToDB, loadPastMessagesFromDB, deleteModuleMemoryFromDB, clearAllWebsimData } from './websim_data.js';
import { processUserRequest, generateModuleGreeting } from './ai_service.js';
import { currentUser, currentUserProfileData, settings, conversationHistory, attachedFile } from './script.js'; // Import global state

let recognition; // For Web Speech API

export function attachEventListeners(appStateAndFunctions) {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const voiceInputButton = document.getElementById('voice-input-button');
    const fileUploadInput = document.getElementById('file-upload-input'); // New file input
    const attachFileButton = document.getElementById('attach-file-button'); // New attach button
    const topbarSettingsButton = document.getElementById('topbar-settings-button');
    const sidebarSettingsButton = document.getElementById('sidebar-settings-button');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const personaSelect = document.getElementById('persona-select');
    const voiceSelect = document.getElementById('voice-select');
    const responseToneSelect = document.getElementById('response-tone-select');
    const longTermMemoryToggle = document.getElementById('long-term-memory-toggle');
    const customInstructionsInput = document.getElementById('custom-instructions');
    const viewPastChatsButton = document.getElementById('view-past-chats');
    const deleteMemoryButton = document.getElementById('delete-memory');
    const avatarInput = document.getElementById('avatar-input');
    const uploadAvatarButton = document.getElementById('upload-avatar-button');
    const usernameInput = document.getElementById('username-input');
    const saveUsernameButton = document.getElementById('save-username-button');
    const themeToggle = document.getElementById('theme-toggle');
    // New settings DOM elements
    const aiVoiceResponsesToggle = document.getElementById('ai-voice-responses-toggle');
    const enableImageLabToggle = document.getElementById('enable-image-lab-toggle');
    const enableMusicStudioToggle = document.getElementById('enable-music-studio-toggle');
    const enableVoiceBotToggle = document.getElementById('enable-voice-bot-toggle');
    const enableRoleplaySimulatorToggle = document.getElementById('enable-roleplay-simulator-toggle');
    const enableDocumentsToggle = document.getElementById('enable-documents-toggle');
    const enableAutoAgentsToggle = document.getElementById('enable-auto-agents-toggle');
    const enableCodeLabToggle = document.getElementById('enable-code-lab-toggle');
    const offlineModeToggle = document.getElementById('offline-mode-toggle');
    const clearCacheButton = document.getElementById('clear-cache-button');
    const customVoiceCommandsInput = document.getElementById('custom-voice-commands');
    const customChatShortcutsInput = document.getElementById('custom-chat-shortcuts');

    // Chat Form Submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = messageInput.value.trim();
        
        // If no user input and no file attached, do nothing
        if (!userInput && !appStateAndFunctions.attachedFile) {
            return;
        }

        let userMessageContent = userInput;
        let messageType = 'text';
        let fileInfo = null;

        if (appStateAndFunctions.attachedFile) {
            fileInfo = appStateAndFunctions.attachedFile;
            messageType = 'file'; // Mark the message type as 'file' if there's an attachment
            
            // Append file info to the prompt for AI, so AI knows about the attached file
            if (userMessageContent) {
                userMessageContent += `\n\n[USER_ATTACHED_FILE]Filename: ${fileInfo.fileName}, Type: ${fileInfo.fileType}, URL: ${fileInfo.url}[/USER_ATTACHED_FILE]`;
            } else { // If no text input, the file info becomes the primary prompt for AI
                userMessageContent = `[USER_ATTACHED_FILE]Filename: ${fileInfo.fileName}, Type: ${fileInfo.fileType}, URL: ${fileInfo.url}[/USER_ATTACHED_FILE]`;
            }
            
            // Display the user's message with the attached file now
            addMessage('user', userInput, 'file', fileInfo.url, fileInfo.fileName, fileInfo.fileType);
        } else {
            // Display just the text message if no file is attached
            addMessage('user', userInput);
        }

        messageInput.value = ''; // Clear input field
        toggleTypingIndicator(true);
        toggleSendButton(true);

        // Prepare message to save to DB
        const userMessageToSave = {
            userId: currentUser.id,
            moduleId: appStateAndFunctions.currentActiveModule(),
            role: 'user',
            timestamp: new Date().toISOString(),
            content: userInput || null, // Can be null if only file
            type: messageType,
            fileUrl: (messageType === 'file' && fileInfo) ? fileInfo.url : null,
            fileName: (messageType === 'file' && fileInfo) ? fileInfo.fileName : null,
            fileType: (messageType === 'file' && fileInfo) ? fileInfo.fileType : null
        };

        // Save user message to DB if long-term memory is on
        if (settings.longTermMemory && currentUser && currentUser.id) {
            await saveMessageToDB(userMessageToSave);
        } else if (!settings.longTermMemory) {
            // Short-term memory: Add the actual user input (not the AI-formatted prompt)
            conversationHistory.push({ ...userMessageToSave });
            conversationHistory = conversationHistory.slice(-10); // Keep last 10 for short-term
        }

        // Process request with AI, passing the combined prompt content
        const { responseText, speechText, imageUrl, imageCaption } = await processUserRequest(
            userMessageContent, // This is what the AI sees (text + file metadata)
            appStateAndFunctions.currentActiveModule(),
            currentUser
        );

        if (responseText) {
            addMessage('ai', responseText);
            if (settings.longTermMemory && currentUser && currentUser.id) {
                await saveMessageToDB({
                    userId: currentUser.id,
                    moduleId: appStateAndFunctions.currentActiveModule(),
                    role: 'assistant',
                    content: responseText,
                    type: 'text',
                    timestamp: new Date().toISOString()
                });
            } else if (!settings.longTermMemory) {
                conversationHistory.push({ role: 'assistant', content: responseText });
            }
        }
        if (imageUrl) {
            addMessage('ai', null, 'image', imageUrl, imageCaption);
            if (settings.longTermMemory && currentUser && currentUser.id) {
                 await saveMessageToDB({
                    userId: currentUser.id,
                    moduleId: appStateAndFunctions.currentActiveModule(),
                    role: 'assistant',
                    content: imageCaption || `AI generated image.`,
                    type: 'image',
                    imageUrl: imageUrl,
                    caption: imageCaption,
                    timestamp: new Date().toISOString()
                });
            }
        }
        if (speechText && settings.enableVoiceResponses) {
            speakMessage(speechText, settings.voice);
        }

        // Clear the attached file reference after sending the message
        appStateAndFunctions.updateAttachedFile(null);

        toggleTypingIndicator(false);
        toggleSendButton(false);
    });

    // Voice Input
    voiceInputButton.addEventListener('click', () => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            if (voiceInputButton.classList.contains('active')) {
                recognition.stop();
                voiceInputButton.classList.remove('active');
                voiceInputButton.textContent = '🎤';
            } else {
                recognition.start();
                voiceInputButton.classList.add('active');
                voiceInputButton.textContent = '🔴';
                messageInput.placeholder = 'Listening...';
            }

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                messageInput.value = transcript;
                voiceInputButton.classList.remove('active');
                voiceInputButton.textContent = '🎤';
                messageInput.placeholder = 'Ask OmniVerseAI anything...';
                chatForm.dispatchEvent(new Event('submit')); // Programmatically submit
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                voiceInputButton.classList.remove('active');
                voiceInputButton.textContent = '🎤';
                messageInput.placeholder = 'Ask OmniVerseAI anything...';
                alert('Speech recognition error. Please try again or type your message.');
            };

            recognition.onend = () => {
                if (voiceInputButton.classList.contains('active')) {
                    voiceInputButton.classList.remove('active');
                    voiceInputButton.textContent = '🎤';
                    messageInput.placeholder = 'Ask OmniVerseAI anything...';
                }
            };

        } else {
            alert('Your browser does not support Web Speech API. Please use Chrome or Edge for voice input.');
        }
    });

    // Attach File Input
    attachFileButton.addEventListener('click', () => {
        fileUploadInput.click(); // Trigger the hidden file input
    });

    fileUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        addMessage('ai', 'Uploading file...'); // Indicate upload progress to user
        toggleSendButton(true); // Disable send button while uploading

        try {
            const url = await websim.upload(file);
            appStateAndFunctions.updateAttachedFile({ url: url, fileName: file.name, fileType: file.type });
            addMessage('ai', `File "${file.name}" uploaded. You can now type a message or simply press send.`);
        } catch (error) {
            console.error('Error uploading file:', error);
            addMessage('ai', 'Failed to upload file. Please try again.');
            appStateAndFunctions.updateAttachedFile(null); // Clear attached file on error
        } finally {
            toggleSendButton(false); // Re-enable send button
            fileUploadInput.value = ''; // Clear the input so the same file can be selected again
            messageInput.focus(); // Focus back to message input
        }
    });

    // Settings Panel Toggles
    topbarSettingsButton.addEventListener('click', () => {
        toggleSettingsPanel(true);
    });
    sidebarSettingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleSettingsPanel(true);
    });
    closeSettingsButton.addEventListener('click', () => {
        toggleSettingsPanel(false);
    });

    // Settings Changes - Core AI preferences
    personaSelect.addEventListener('change', (e) => { settings.persona = e.target.value; saveSettings(settings); });
    voiceSelect.addEventListener('change', (e) => { settings.voice = e.target.value; saveSettings(settings); });
    responseToneSelect.addEventListener('change', (e) => { settings.responseTone = e.target.value; saveSettings(settings); });
    longTermMemoryToggle.addEventListener('change', async (e) => {
        settings.longTermMemory = e.target.checked;
        saveSettings(settings);
        if (settings.longTermMemory) {
            await loadPastMessagesFromDB(currentUser, appStateAndFunctions.currentActiveModule(), addMessage, conversationHistory);
            addMessage('ai', `Long-term memory enabled. Loading past conversations for the '${appStateAndFunctions.currentActiveModule()}' section.`);
        } else {
            conversationHistory.length = 0; // Clear local history
            document.getElementById('message-list').innerHTML = ''; // Clear display
            addMessage('ai', 'Long-term memory has been disabled for this session. Your chat history will not be saved or loaded.');
        }
    });
    customInstructionsInput.addEventListener('input', (e) => { settings.customInstructions = e.target.value; saveSettings(settings); });

    // New settings action buttons
    viewPastChatsButton.addEventListener('click', async () => {
        if (settings.longTermMemory) {
            console.log(`Viewing past chats for module '${appStateAndFunctions.currentActiveModule()}':`);
            await loadPastMessagesFromDB(currentUser, appStateAndFunctions.currentActiveModule(), addMessage, conversationHistory);
            addMessage('ai', `Here are your past conversations loaded from memory for the '${appStateAndFunctions.currentActiveModule()}' section.`);
        } else {
            alert('Long-term memory is currently disabled. Please enable it in settings to view past chats.');
            console.log('Local Conversation History (if any):', conversationHistory);
        }
    });

    deleteMemoryButton.addEventListener('click', async () => {
        if (!currentUser || !currentUser.id) {
            addMessage('ai', "You must be logged in to delete persistent memory.");
            return;
        }
        if (confirm(`Are you sure you want to delete all conversation memory for the '${appStateAndFunctions.currentActiveModule()}' section? This cannot be undone.`)) {
            try {
                await deleteModuleMemoryFromDB(currentUser, appStateAndFunctions.currentActiveModule());
                conversationHistory.length = 0; // Clear local history
                document.getElementById('message-list').innerHTML = ''; // Clear display
                addMessage('ai', `Your long-term memory for the '${appStateAndFunctions.currentActiveModule()}' section has been completely erased. A fresh start!`);
            } catch (error) {
                console.error("Error deleting memory:", error);
                addMessage('ai', 'Failed to delete memory. Please try again.');
            }
        }
    });

    // Avatar Upload functionality
    uploadAvatarButton.addEventListener('click', async () => {
        if (!currentUser || !currentUser.id) {
            addMessage('ai', "You must be logged in to upload a custom avatar.");
            return;
        }

        const file = avatarInput.files[0];
        if (!file) {
            addMessage('ai', "Please select an image file to upload.");
            return;
        }

        addMessage('ai', 'Uploading your new avatar...');
        try {
            const url = await websim.upload(file);
            currentUserProfileData.avatarUrl = url;
            await saveUserProfileDataToDB(currentUser, currentUserProfileData);

            updateUserInfoDisplay(currentUser, currentUserProfileData); // Update UI
            addMessage('ai', 'Your new avatar has been successfully uploaded and set! This change will be saved permanently to your profile.');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            addMessage('ai', 'Failed to upload your avatar. Please try again.');
        }
    });

    // Username Save functionality
    saveUsernameButton.addEventListener('click', async () => {
        if (!currentUser || !currentUser.id) {
            addMessage('ai', "You must be logged in to set a custom display name.");
            return;
        }

        const newDisplayName = usernameInput.value.trim();
        if (!newDisplayName) {
            addMessage('ai', "Display name cannot be empty.");
            return;
        }

        addMessage('ai', `Updating your display name to "${newDisplayName}"...`);
        try {
            currentUserProfileData.customDisplayName = newDisplayName;
            await saveUserProfileDataToDB(currentUser, currentUserProfileData);

            updateUserInfoDisplay(currentUser, currentUserProfileData); // Update UI
            addMessage('ai', `Your display name has been updated to "${newDisplayName}". This change will be saved permanently to your profile.`);
        } catch (error) {
            console.error('Error saving display name:', error);
            addMessage('ai', 'Failed to save your display name. Please try again.');
        }
    });

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // NEW FEATURE: Theme & UX Settings
    aiVoiceResponsesToggle.addEventListener('change', (e) => { settings.enableVoiceResponses = e.target.checked; saveSettings(settings); });

    // NEW FEATURE: Tool Preferences
    enableImageLabToggle.addEventListener('change', (e) => { settings.enableImageLabModule = e.target.checked; saveSettings(settings); });
    enableMusicStudioToggle.addEventListener('change', (e) => { settings.enableMusicStudioModule = e.target.checked; saveSettings(settings); });
    enableVoiceBotToggle.addEventListener('change', (e) => { settings.enableVoiceBotModule = e.target.checked; saveSettings(settings); });
    enableRoleplaySimulatorToggle.addEventListener('change', (e) => { settings.enableRoleplaySimulatorModule = e.target.checked; saveSettings(settings); });
    enableDocumentsToggle.addEventListener('change', (e) => { settings.enableDocumentsModule = e.target.checked; saveSettings(settings); });
    enableAutoAgentsToggle.addEventListener('change', (e) => { settings.enableAutoAgentsModule = e.target.checked; saveSettings(settings); });
    enableCodeLabToggle.addEventListener('change', (e) => { settings.enableCodeLabModule = e.target.checked; saveSettings(settings); });

    // NEW FEATURE: Privacy & Offline Mode
    offlineModeToggle.addEventListener('change', (e) => { settings.offlineMode = e.target.checked; saveSettings(settings); });
    clearCacheButton.addEventListener('click', async () => {
        if (!currentUser || !currentUser.id) {
            addMessage('ai', "You must be logged in to clear all app data.");
            return;
        }
        if (confirm("Are you sure you want to clear ALL your OmniVerseAI app data and cache (including chat history and profile settings)? This cannot be undone.")) {
            try {
                // Clear local storage settings first
                localStorage.removeItem('omniVerseAiSettings');
                // Clear WebsimSocket data
                await clearAllWebsimData(currentUser);
                
                // Reset local state and reload app (or just refresh)
                Object.assign(settings, { // Reset settings to default structure
                    persona: 'Friendly',
                    voice: 'en-male',
                    responseTone: 'default',
                    longTermMemory: false,
                    customInstructions: '',
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
                }); 
                conversationHistory.length = 0; // Clear local history
                currentUserProfileData = { id: null, userId: null, customDisplayName: null, avatarUrl: null };
                addMessage('ai', 'All app data and cache have been cleared. Please refresh the page to start fresh.');
                // For a more complete reset, a window.location.reload() would be ideal here,
                // but for simulation purposes, we'll just reset internal state and prompt.
                // alert('All app data and cache cleared. The page will now reload.');
                // window.location.reload(); 
            } catch (error) {
                console.error("Failed to clear all app data:", error);
                addMessage('ai', 'Failed to clear all app data. Please try again.');
            }
        }
    });

    // NEW FEATURE: Custom Triggers
    customVoiceCommandsInput.addEventListener('input', (e) => { settings.customVoiceCommands = e.target.value; saveSettings(settings); });
    customChatShortcutsInput.addEventListener('input', (e) => { settings.customChatShortcuts = e.target.value; saveSettings(settings); });

    // Sidebar module click handlers
    document.querySelectorAll('#sidebar ul li a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const module = e.target.dataset.module;
            if (module && module !== 'settings') {
                appStateAndFunctions.setActiveModule(module); // Use the passed function
            } else if (module === 'settings') {
                toggleSettingsPanel(true);
            }
        });
    });
}