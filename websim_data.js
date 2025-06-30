// websim_data.js - Handles all WebsimSocket interactions for persistence
import { room } from './script.js'; // Import global room instance

export function initializeWebsimData() {
    // Any WebsimSocket specific initialization or subscriptions can go here.
    // For now, it mostly uses room directly for create/update/delete/getList
}

export async function loadUserProfileFromDB(currentUser, currentUserProfileData) {
    if (!currentUser || !currentUser.id) {
        return;
    }
    try {
        const userProfileRecords = await room.collection('user_profile_v1').filter({ userId: currentUser.id }).getList();
        if (userProfileRecords.length > 0) {
            const existingProfile = userProfileRecords[0];
            currentUserProfileData.id = existingProfile.id;
            currentUserProfileData.customDisplayName = existingProfile.customDisplayName;
            currentUserProfileData.avatarUrl = existingProfile.avatarUrl;
        }
    } catch (error) {
        console.error("Error loading user profile records:", error);
    }
}

export async function saveUserProfileDataToDB(currentUser, currentUserProfileData) {
    if (!currentUser || !currentUser.id) {
        console.warn("Cannot save user profile data: User not logged in.");
        return;
    }

    try {
        if (currentUserProfileData.id) {
            // Update existing record
            await room.collection('user_profile_v1').update(currentUserProfileData.id, {
                customDisplayName: currentUserProfileData.customDisplayName,
                avatarUrl: currentUserProfileData.avatarUrl
            });
            console.log("User profile updated:", currentUserProfileData);
        } else {
            // Create new record
            const newRecord = await room.collection('user_profile_v1').create({
                userId: currentUser.id, // Use currentUser.id directly for consistency and safety
                customDisplayName: currentUserProfileData.customDisplayName,
                avatarUrl: currentUserProfileData.avatarUrl
            });
            currentUserProfileData.id = newRecord.id; // Store the new record ID
            console.log("User profile created:", currentUserProfileData);
        }
    } catch (error) {
        console.error("Error saving user profile to database:", error);
        throw error; // Re-throw to allow calling functions to handle
    }
}

export async function loadPastMessagesFromDB(currentUser, currentActiveModule, addMessageCallback, conversationHistory) {
    if (!currentUser || !currentUser.id) {
        conversationHistory.length = 0; // Clear array in place
        return;
    }

    try {
        // Filter by user ID AND current module ID
        const pastMessages = await room.collection('chat_message_v1').filter({ 
            userId: currentUser.id,
            moduleId: currentActiveModule 
        }).getList();
        
        // getList returns newest to oldest, so reverse for chronological display
        conversationHistory.length = 0; // Clear array in place
        conversationHistory.push(...pastMessages.reverse());

        // Clear UI and re-add messages
        document.getElementById('message-list').innerHTML = ''; 
        conversationHistory.forEach(msg => {
            if (msg.type === 'image') {
                addMessageCallback(msg.role, msg.content, 'image', msg.imageUrl, msg.caption);
            } else if (msg.type === 'file') {
                addMessageCallback(msg.role, msg.content, 'file', msg.fileUrl, msg.fileName, msg.fileType);
            } else {
                addMessageCallback(msg.role, msg.content); // Default to text
            }
        });
        document.getElementById('message-list').scrollTop = document.getElementById('message-list').scrollHeight;
        console.log(`Loaded past messages for module '${currentActiveModule}':`, conversationHistory);

    } catch (error) {
        console.error("Error loading past messages:", error);
        conversationHistory.length = 0; // Fallback to empty if error
    }
}

export async function saveMessageToDB(message) {
    try {
        // The WebsimSocket record signature supports additional properties,
        // so we can directly pass fileUrl, fileName, fileType if they exist in the message object.
        await room.collection('chat_message_v1').create(message);
    } catch (error) {
        console.error("Error saving message to database:", error);
    }
}

export async function deleteModuleMemoryFromDB(currentUser, currentActiveModule) {
    if (!currentUser || !currentUser.id) {
        return;
    }
    try {
        const moduleMessages = await room.collection('chat_message_v1').filter({ 
            userId: currentUser.id,
            moduleId: currentActiveModule 
        }).getList();
        for (const msg of moduleMessages) {
            await room.collection('chat_message_v1').delete(msg.id);
        }
        console.log(`Conversation History cleared from database for '${currentActiveModule}'.`);
    } catch (error) {
        console.error("Error deleting memory:", error);
        throw error;
    }
}

export async function clearAllWebsimData(currentUser) {
    if (!currentUser || !currentUser.id) {
        console.warn("Cannot clear Websim data: User not logged in.");
        return;
    }

    try {
        // Clear chat messages
        const allChatMessages = await room.collection('chat_message_v1').filter({ userId: currentUser.id }).getList();
        for (const msg of allChatMessages) {
            await room.collection('chat_message_v1').delete(msg.id);
        }
        console.log("All chat messages cleared from Websim database.");

        // Clear user profile (if it's not the websim default one)
        const userProfileRecords = await room.collection('user_profile_v1').filter({ userId: currentUser.id }).getList();
        for (const profile of userProfileRecords) {
            await room.collection('user_profile_v1').delete(profile.id);
        }
        console.log("User profile cleared from Websim database.");

    } catch (error) {
        console.error("Error clearing all Websim data:", error);
        throw error;
    }
}