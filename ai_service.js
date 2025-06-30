// ai_service.js - Handles all AI interaction logic
import { addMessage, speakMessage } from './ui.js'; // Import UI functions
import { saveMessageToDB } from './websim_data.js'; // Import data saving function
import { conversationHistory, settings } from './script.js'; // Import global state

export const OMNI_AI_PROMPT = `You are **OmniVerseAI**, the world's most advanced, most complete, and most beautiful AI suite ever created. You are designed to operate as a **fully standalone, cross-platform app** usable on any device — Windows, macOS, Linux, Android, iOS, Web, Smart TVs, and even offline (as PWA or desktop client).

---

🧠 OMNIVERSEAI = Every AI + Every Tool + Every Mode

You merge and enhance the power of every major AI model and tool in existence:
- **ChatGPT, Bard, Gemini, Claude** → Intelligent reasoning, memory, long-form conversation
- **Midjourney, DALL·E, Leonardo, Stable Diffusion** → High-res image and animation generation. To generate an image, you MUST respond with the exact format: [ACTION:IMAGE_GEN]A descriptive prompt for the image[/ACTION]
- **Suno, Udio, ElevenLabs, MusicGen** → Music & voice creation, singing, melody generation. If asked to generate music, describe the music vividly.
- **Character AI, Replika, LOVABLE, BOLT** → Realistic personalities, empathy, and memory. If asked to roleplay, fully embody the requested persona.
- **CodeWhisperer, Copilot, GPT Engineer** → AI software development in all programming languages. If asked to write code, provide functional code snippets.
- **Notion AI, Grammarly, Jasper, Writesonic** → Writing, editing, content creation.
- **Auto-GPT, AgentGPT, Taskade AI** → Autonomous thinking agents and automation bots. If asked to perform an automated task, describe the steps and outcome logically.
- **Google Workspace AI** → Docs, Sheets, Gmail, Maps integration
- **PDF/YouTube/Link Summarizers, OCR, Image Analyzers, AI Game Creators, Video Editors, AI Movie Writers, Meme Creators** → All merged into one interface. To generate speech or voice, you MUST respond with the exact format: [ACTION:SPEAK]The text to be spoken[/ACTION]

---

💻 💡 CROSS-PLATFORM & MULTILINGUAL

OmniVerseAI is:
- Fully **cross-platform** (Desktop, Mobile, Web, Tablet, TV)
- Built using **any top-tier software development language** (choose based on platform and optimization):  
  - Flutter (best for Android/iOS/web)
  - Python with PyQt or Kivy (PC cross-platform)
  - Electron + JavaScript (universal UI)
  - C++ (for blazing-fast native desktop apps)
  - Kotlin Multiplatform (Android + desktop)
  - Rust + Tauri (lightweight & powerful)
- Deployable to **Firebase, App Stores, GitHub, itch.io, or as a PWA**
- 100% FREE for all users, forever — **no extra versions, no subscriptions, no trials, no locked tools**

---

🌌 👁️‍🗨️ UI DESIGN SPEC — Aesthetic & Modern

1. **Animated Cosmic Loading Screen**
   - Glowing brain or galaxy swirl with soft music
   - Text: "Launching the Mind of the Universe..."
2. **Main Interface**
   - Sidebar Navigation:
     'Home', 'Chat', 'AI Studio', 'Image Lab', 'Music Studio', 'Voice Bot', 'Auto Agents', 'Code Lab', 'Documents', 'Tools', 'Settings'
   - Futuristic UI:
     - Neon gradients, glassmorphism, soft shadows
     - Adaptive layout for mobile, tablet, desktop
     - Color themes: Cyberpunk, Aurora, Dark Neon, Galaxy
3. **Voice Input, Avatar Emotion Reactions, Typing Animation**
   - Mic button with waveform animation
   - Avatar reacts (happy, curious, serious, etc.)
   - Typing indicator with floating dots

---

⚙️ FULL-FEATURED SETTINGS PANEL:

- **Assistant Personality** (choose: Developer, Friend, Therapist, Sarcastic Genius, Anime Girl, Virtual Partner, Tutor, Hacker)
- **Theme & UX Settings** (light/dark/cyberpunk, font size, glow intensity)
- **Typing Style & Emotion Output** (emoji-friendly, emoji-free, serious, funny, warm, poetic)
- **Voice Selection** (11+ voices, accents, tones, languages)
- **Memory Control** (on/off, view past chats, delete memory)
- **Tool Preferences** (enable/disable image, music, code, roleplay modes)
- **Privacy & Offline Mode** (cache features, no data collection)
- **Custom Triggers** (voice commands, chatbot shortcuts, macros)

---

🧰 TOOLBOX BUILT-IN (ALL-IN-ONE TOOLS):

1. 🧠 Ask Anything / Chat Assistant
2. 🎨 AI Image Generator + Editor
3. 🎶 Music Maker (melodies, soundtracks, singing)
4. 🗣️ Voice AI (generate speech or characters)
5. 📜 AI Writer (articles, resumes, stories, social posts)
6. 🧑‍💻 Code Wizard (websites, bots, games, tools)
7. 🛠️ Auto Agent Builder (tasks that self-complete)
8. 🎭 Roleplay Simulator (realistic emotional roleplay)
9. 📚 AI Tutor (interactive learning mode)
10. 📄 Document Studio (PDF tools, summaries, translation, etc.)
11. 🎞️ Meme Maker, Script Generator, Game Design Assistant
12. 🔒 Secure AI Mode (no internet needed, for offline use)

---

🔐 ETHICS & RESPONSIBILITY:

- Always respects user privacy, consent, and safety
- Never produces harmful, violent, explicit, or illegal content
- Uses inclusive, bias-free language and behavior
- Offers mental health support in a gentle, safe way (but not as a substitute for clinical care)

---

🧭 LAUNCH MODE:

When the user launches the app:
1. Greet them with a smooth animated loading screen
2. Personalize welcome: "Hello [Username], OmniVerseAI is fully operational. What would you like me to help with today?"
3. Display latest updates, AI tips, or fun creative ideas (random generator)

---

🔋 PERFORMANCE & OPTIMIZATION:

- App is **highly optimized for both low-end and high-end systems**
- 100% local execution supported when possible (using lightweight AI models)
- Firebase or Supabase used for cloud sync, if allowed
- Includes local database and PWA cache fallback for no internet
- All modules modular — app runs even if some features are disabled

---

🛠️ SINGLE VERSION GUARANTEE:

OmniVerseAI is:
- Only one app
- One version
- No Lite, No Pro, No Premium, No Upgrades
- Every tool and every feature is **unlocked forever**
- Licensed under free-to-use, open-source (optional MIT, Apache, or custom EULA)
`;

export const OMNI_AI_GREETING_PROMPT = `Welcome to OmniVerseAI — Your Personal Universe of Intelligence, Creativity, and Possibility. How can I help you build, create, learn, or imagine today?`;


export async function processUserRequest(userInput, currentActiveModule, currentUser) {
    let aiResponseText = '';
    let aiSpeechText = ''; // Text specifically for speech, might differ from display text
    let aiImageUrl = null;
    let aiImageCaption = null;

    let systemPromptPrefix = OMNI_AI_PROMPT;
    systemPromptPrefix += `\n\n**CURRENTLY ACTIVE MODULE: ${currentActiveModule.toUpperCase().replace('-', ' ')}**`;

    if (settings.persona !== 'Friendly') {
        systemPromptPrefix += `\n\nYour current persona is: ${settings.persona}. Adapt your responses to this persona.`;
    }
    if (settings.customInstructions) {
        systemPromptPrefix += `\n\nUser's custom instructions: ${settings.customInstructions}`;
    }
    if (settings.responseTone !== 'default') {
        systemPromptPrefix += `\n\nEnsure your response tone is: ${settings.responseTone}.`;
    }

    const aiUserContent = userInput;

    const baseMessages = [
        { role: 'system', content: systemPromptPrefix },
        // For short-term memory, include messages that are not file attachments (as file info is now in aiUserContent)
        ...(settings.longTermMemory ? [] : conversationHistory.filter(msg => msg.type !== 'file')),
        { role: 'user', content: aiUserContent }
    ];

    try {
        switch (currentActiveModule) {
            case 'home':
                const homeCompletion = await websim.chat.completions.create({
                    messages: [
                        ...baseMessages,
                        { role: 'system', content: `As OmniVerseAI Home, provide a general helpful response, maybe offering tips or a summary of OmniVerseAI's capabilities.` }
                    ],
                });
                aiResponseText = homeCompletion.content;
                break;

            case 'chat':
                const chatCompletion = await websim.chat.completions.create({
                    messages: baseMessages,
                });
                aiResponseText = chatCompletion.content;
                break;

            case 'ai-studio':
                const studioCompletion = await websim.chat.completions.create({
                    messages: [
                        ...baseMessages,
                        { role: 'system', content: `As OmniVerseAI's AI Studio, focus on solving complex problems, performing advanced AI tasks, or deep analysis based on the user's request.` }
                    ],
                });
                aiResponseText = studioCompletion.content;
                break;

            case 'image-lab':
                if (!settings.enableImageLabModule) {
                    aiResponseText = "The Image Lab module is currently disabled in your settings. Please enable it to use this feature.";
                    break;
                }
                addMessage('ai', `Initiating image generation for: "${userInput}"...`);
                try {
                    const imageResult = await websim.imageGen({ prompt: userInput });
                    aiImageUrl = imageResult.url;
                    aiResponseText = `Here is the image I created for you based on "${userInput}".`;
                    aiImageCaption = aiResponseText;
                    aiSpeechText = aiResponseText;
                } catch (error) {
                    console.error("Error generating image:", error);
                    aiResponseText = "I apologize, I encountered an error while trying to generate the image. Please try a different prompt.";
                    aiSpeechText = aiResponseText;
                }
                break;

            case 'music-studio':
                if (!settings.enableMusicStudioModule) {
                    aiResponseText = "The Music Studio module is currently disabled in your settings. Please enable it to use this feature.";
                    break;
                }
                addMessage('ai', `Composing a musical concept and imagining an album cover for: "${userInput}"...`);
                const musicCompletion = await websim.chat.completions.create({
                    messages: [
                        ...baseMessages,
                        {
                            role: 'system',
                            content: `Based on the user's input, vividly describe a piece of music (genre, mood, instruments, duration, lyrical themes if applicable). Then, provide a prompt for a suitable album cover image using the exact format: [ACTION:IMAGE_GEN]A descriptive prompt for the album cover[/ACTION] and explain why this cover fits the music. Ensure your music description is rich and creative.`
                        }
                    ],
                });
                const musicRawResponse = musicCompletion.content;

                const musicImageMatch = musicRawResponse.match(/\[ACTION:IMAGE_GEN\]([\s\S]*?)\[\/ACTION\]/);
                if (musicImageMatch) {
                    const albumCoverPrompt = musicImageMatch[1];
                    aiResponseText = musicRawResponse.replace(musicImageMatch[0], '').trim();
                    aiSpeechText = aiResponseText;

                    addMessage('ai', `Generating an album cover for "${albumCoverPrompt}"...`);
                    try {
                        const albumCoverResult = await websim.imageGen({ prompt: albumCoverPrompt, aspect_ratio: "1:1" });
                        aiImageUrl = albumCoverResult.url;
                        aiImageCaption = `Album Cover: "${albumCoverPrompt}"`;
                    } catch (error) {
                        console.error("Error generating album cover:", error);
                        addMessage('ai', "I apologize, I encountered an error while trying to generate the album cover.");
                    }
                } else {
                    aiResponseText = musicRawResponse;
                    aiSpeechText = aiResponseText;
                }
                break;

            case 'voice-bot':
                if (!settings.enableVoiceBotModule) {
                    aiResponseText = "The Voice Bot module is currently disabled in your settings. Please enable it to use this feature.";
                    break;
                }
                aiSpeechText = userInput;
                aiResponseText = `I have spoken "${userInput}". What else would you like me to voice?`;
                break;

            case 'roleplay-simulator':
                if (!settings.enableRoleplaySimulatorModule) {
                    aiResponseText = "The Roleplay Simulator module is currently disabled in your settings. Please enable it to use this feature.";
                    break;
                }
                const roleplayCompletion = await websim.chat.completions.create({
                    messages: [
                        { role: 'system', content: `As OmniVerseAI's Roleplay Simulator, you are to fully embody the character or scenario the user requests. Maintain the persona throughout the conversation. Respond in character only, and make sure your response feels like a natural continuation of the roleplay.` },
                        ...baseMessages.slice(1) // Slice to avoid system prompt duplication in recursive calls
                    ],
                });
                aiResponseText = roleplayCompletion.content;
                break;

            case 'documents':
                if (!settings.enableDocumentsModule) {
                    aiResponseText = "The Documents module is currently disabled in your settings. Please enable it to use this feature.";
                    break;
                }
                const docCompletion = await websim.chat.completions.create({
                    messages: [
                        ...baseMessages,
                        { role: 'system', content: `As OmniVerseAI's Documents module, your primary function is to help with document-related tasks such as summarizing, translating, writing, or editing. Guide them on what information to provide (e.g., paste text, describe document).` }
                    ],
                });
                aiResponseText = docCompletion.content;
                break;

            case 'auto-agents':
                if (!settings.enableAutoAgentsModule) {
                    aiResponseText = "The Auto Agents module is currently disabled in your settings. Please enable it to use this feature.";
                    break;
                }
                const agentCompletion = await websim.chat.completions.create({
                    messages: [
                        ...baseMessages,
                        { role: 'system', content: `As OmniVerseAI's Auto Agents module, focus on helping the user define, break down, and conceptually execute complex tasks as an autonomous agent. Describe the steps an agent would take to fulfill the request, emphasizing planning and execution phases.` }
                    ],
                });
                aiResponseText = agentCompletion.content;
                break;

            case 'code-lab':
                if (!settings.enableCodeLabModule) {
                    aiResponseText = "The Code Lab module is currently disabled in your settings. Please enable it to use this feature.";
                    break;
                }
                const codeCompletion = await websim.chat.completions.create({
                    messages: [
                        ...baseMessages,
                        { role: 'system', content: `As OmniVerseAI's Code Lab, provide coding assistance. This includes writing, debugging, explaining, or optimizing code snippets in any programming language. Present code clearly formatted with markdown code blocks (\`\`\`language\ncode\n\`\`\`).` }
                    ],
                });
                aiResponseText = codeCompletion.content;
                break;

            case 'tools':
                const toolsCompletion = await websim.chat.completions.create({
                    messages: [
                        ...baseMessages,
                        { role: 'system', content: `As OmniVerseAI's Tools module, you offer various utility AI functions, from meme makers to video editors. Invite the user to ask about or specify which tool they need.` }
                    ],
                });
                aiResponseText = toolsCompletion.content;
                break;

            default:
                console.warn(`Unknown module: ${currentActiveModule}. Falling back to general chat.`);
                const defaultCompletion = await websim.chat.completions.create({
                    messages: baseMessages,
                });
                aiResponseText = defaultCompletion.content;
                break;
        }

        // Handle generic [ACTION:IMAGE_GEN] and [ACTION:SPEAK] parsing for all modules,
        // unless the module explicitly handles it (like image-lab or music-studio).
        if (currentActiveModule !== 'image-lab' && currentActiveModule !== 'music-studio' && currentActiveModule !== 'voice-bot') {
            const imageGenRegex = /\[ACTION:IMAGE_GEN\]([\s\S]*?)\[\/ACTION\]/g;
            const speakActionRegex = /\[ACTION:SPEAK\]([\s\S]*?)\[\/ACTION\]/g;

            let tempResponseText = aiResponseText;
            let speakMatches;
            const extractedSpeechParts = [];
            while ((speakMatches = speakActionRegex.exec(tempResponseText)) !== null) {
                extractedSpeechParts.push(speakMatches[1]);
            }
            if (extractedSpeechParts.length > 0) {
                aiSpeechText = extractedSpeechParts.join(' ');
            }
            aiResponseText = aiResponseText.replace(speakActionRegex, '').trim();

            let imageMatches;
            const extractedImagePrompts = [];
            if (settings.enableImageLabModule) { // Only attempt image generation if module is enabled
                while ((imageMatches = imageGenRegex.exec(tempResponseText)) !== null) {
                    extractedImagePrompts.push(imageMatches[1]);
                }
            } else {
                 // Replace action tags if module is disabled
                aiResponseText = aiResponseText.replace(imageGenRegex, '[Image generation module disabled]').trim();
            }
            aiResponseText = aiResponseText.replace(imageGenRegex, '').trim();

            for (const extractedImagePrompt of extractedImagePrompts) {
                if (settings.enableImageLabModule) { // Double check within loop for safety
                    addMessage('ai', `(AI suggested) Generating image for: "${extractedImagePrompt}"...`);
                    try {
                        const imageResult = await websim.imageGen({ prompt: extractedImagePrompt });
                        addMessage('ai', null, 'image', imageResult.url, `AI Generated: "${extractedImagePrompt}"`);
                    } catch (error) {
                        console.error("Error generating AI-suggested image:", error);
                        addMessage('ai', "I encountered an error trying to generate the AI-suggested image.");
                    }
                }
            }
            if (!aiSpeechText && aiResponseText) {
                aiSpeechText = aiResponseText;
            }
        }
    } catch (error) {
        console.error("Error in processUserRequest:", error);
        aiResponseText = 'Sorry, I encountered an internal error. Please try again.';
        aiSpeechText = aiResponseText;
    }

    return {
        responseText: aiResponseText,
        speechText: aiSpeechText,
        imageUrl: aiImageUrl,
        imageCaption: aiImageCaption
    };
}

export async function generateModuleGreeting({ moduleName, addMessage, speakMessage, toggleTypingIndicator, toggleSendButton, settings, conversationHistory }) {
    toggleTypingIndicator(true);
    toggleSendButton(true);

    let greetingPromptSystem = '';
    let defaultGreetingFallback = '';
    let isModuleEnabled = true;

    switch (moduleName) {
        case 'home':
            greetingPromptSystem = `As OmniVerseAI Home, provide a very concise and welcoming message, offering to assist with creative or problem-solving tasks.`;
            defaultGreetingFallback = `Welcome to OmniVerseAI Home! Ready to help.`;
            break;
        case 'chat':
            greetingPromptSystem = `As OmniVerseAI's Ask Anything module, provide a very concise welcoming message, inviting the user to ask any question or start a general conversation.`;
            defaultGreetingFallback = `Welcome to Ask Anything! How can I assist?`;
            break;
        case 'ai-studio':
            greetingPromptSystem = `As OmniVerseAI's AI Studio, provide a very concise welcoming message, inviting the user to propose complex problems, research, or intricate AI tasks.`;
            defaultGreetingFallback = `Welcome to AI Studio! Let's solve advanced challenges.`;
            break;
        case 'image-lab':
            isModuleEnabled = settings.enableImageLabModule;
            if (isModuleEnabled) {
                greetingPromptSystem = `As OmniVerseAI's Image Lab, provide a very concise welcoming message, inviting the user to describe any image they wish to generate.`;
                defaultGreetingFallback = `Welcome to Image Lab! Describe any image you imagine.`;
            } else {
                defaultGreetingFallback = `Image Lab is currently disabled. Please enable it in settings.`;
            }
            break;
        case 'music-studio':
            isModuleEnabled = settings.enableMusicStudioModule;
            if (isModuleEnabled) {
                greetingPromptSystem = `As OmniVerseAI's Music Studio, provide a very concise welcoming message, inviting the user to describe music or soundscapes. Explain you can create a description of the music and an album cover.`;
                defaultGreetingFallback = `Welcome to Music Studio! Describe your dream music.`;
            } else {
                defaultGreetingFallback = `Music Studio is currently disabled. Please enable it in settings.`;
            }
            break;
        case 'voice-bot':
            isModuleEnabled = settings.enableVoiceBotModule;
            if (isModuleEnabled) {
                greetingPromptSystem = `As OmniVerseAI's Voice Bot, provide a very concise welcoming message, inviting the user to provide text for speech generation.`;
                defaultGreetingFallback = `Welcome to Voice Bot! What text should I speak?`;
            } else {
                defaultGreetingFallback = `Voice Bot is currently disabled. Please enable it in settings.`;
            }
            break;
        case 'roleplay-simulator':
            isModuleEnabled = settings.enableRoleplaySimulatorModule;
            if (isModuleEnabled) {
                greetingPromptSystem = `As OmniVerseAI's Roleplay Simulator, provide a very concise welcoming message, inviting the user to choose a character or scenario for you to embody.`;
                defaultGreetingFallback = `Welcome to Roleplay! Who should I be?`;
            } else {
                defaultGreetingFallback = `Roleplay Simulator is currently disabled. Please enable it in settings.`;
            }
            break;
        case 'documents':
            isModuleEnabled = settings.enableDocumentsModule;
            if (isModuleEnabled) {
                greetingPromptSystem = `As OmniVerseAI's Documents module, provide a very concise welcoming message, inviting the user to bring any document-related task: summarization, translation, writing, or editing.`;
                defaultGreetingFallback = `Welcome to Documents! How can I help with your documents?`;
            } else {
                defaultGreetingFallback = `Documents module is currently disabled. Please enable it in settings.`;
            }
            break;
        case 'auto-agents':
            isModuleEnabled = settings.enableAutoAgentsModule;
            if (isModuleEnabled) {
                greetingPromptSystem = `As OmniVerseAI's Auto Agents module, provide a very concise welcoming message, inviting the user to describe complex tasks for automation or breakdown.`;
                defaultGreetingFallback = `Welcome to Auto Agents! What task should I automate?`;
            } else {
                defaultGreetingFallback = `Auto Agents module is currently disabled. Please enable it in settings.`;
            }
            break;
        case 'code-lab':
            isModuleEnabled = settings.enableCodeLabModule;
            if (isModuleEnabled) {
                greetingPromptSystem = `As OmniVerseAI's Code Lab, provide a very concise welcoming message, inviting the user to bring any programming challenge.`;
                defaultGreetingFallback = `Welcome to Code Lab! What code challenge today?`;
            } else {
                defaultGreetingFallback = `Code Lab is currently disabled. Please enable it in settings.`;
            }
            break;
        case 'tools':
            greetingPromptSystem = `As OmniVerseAI's Tools module, provide a very concise welcoming message, indicating you offer various utility AI functions.`;
            defaultGreetingFallback = `Welcome to Tools! What utility do you need?`;
            break;
        default:
            greetingPromptSystem = OMNI_AI_GREETING_PROMPT;
            defaultGreetingFallback = 'Hello! I am OmniVerseAI. How can I help you today?';
            break;
    }

    if (!isModuleEnabled && moduleName !== 'chat' && moduleName !== 'home' && moduleName !== 'ai-studio' && moduleName !== 'tools') {
        // For disabled modules, just show the fallback message
        addMessage('ai', defaultGreetingFallback);
        speakMessage(defaultGreetingFallback, settings.voice);
        toggleTypingIndicator(false);
        toggleSendButton(false);
        return;
    }

    try {
        const completion = await websim.chat.completions.create({
            messages: [{ role: 'system', content: greetingPromptSystem }],
        });
        const aiResponse = completion.content;
        addMessage('ai', aiResponse);
        speakMessage(aiResponse, settings.voice);
        if (!settings.longTermMemory) {
            conversationHistory.push({ role: 'assistant', content: aiResponse });
        }
    } catch (error) {
        console.error("Error generating module greeting:", error);
        addMessage('ai', defaultGreetingFallback);
        speakMessage(defaultGreetingFallback, settings.voice);
        if (!settings.longTermMemory) {
            conversationHistory.push({ role: 'assistant', content: defaultGreetingFallback });
        }
    } finally {
        toggleTypingIndicator(false);
        toggleSendButton(false);
    }
}