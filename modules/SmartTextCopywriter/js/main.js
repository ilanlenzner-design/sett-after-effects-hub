
// main.js

const csInterface = new CSInterface();
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
// Default to 1.5-flash but we will respect what we find or fallback
let currentModel = "gemini-1.5-flash";

let currentApiKey = localStorage.getItem("smart_copy_api_key") || "";

// DOM Elements
const elements = {
    draftText: document.getElementById("draft-text"),
    refreshBtn: document.getElementById("refresh-source-btn"),
    generateBtn: document.getElementById("generate-btn"),
    resultsContainer: document.getElementById("results-container"),
    settingsBtn: document.getElementById("settings-btn"),
    settingsModal: document.getElementById("settings-modal"),
    closeSettingsBtn: document.getElementById("close-settings-btn"),
    apiKeyInput: document.getElementById("api-key-input"),
    saveSettingsBtn: document.getElementById("save-settings-btn"),
    debugBtn: document.getElementById("debug-btn") // New button
};

// Init
function init() {
    loadSettings();
    updateLayerSelection();

    // Event Listeners
    elements.refreshBtn.addEventListener("click", updateLayerSelection);
    elements.generateBtn.addEventListener("click", handleGenerate);
    elements.settingsBtn.addEventListener("click", openSettings);
    elements.closeSettingsBtn.addEventListener("click", closeSettings);
    elements.saveSettingsBtn.addEventListener("click", saveSettings);
    if (elements.debugBtn) elements.debugBtn.addEventListener("click", runDiagnostics);

    // Design Tools
    document.getElementById("add-bg-btn").addEventListener("click", () => runDesignTool("addSmartBackground"));

    document.getElementById("apply-anim-btn").addEventListener("click", () => {
        const type = document.getElementById("anim-select").value;
        runDesignTool("applyAnimationPreset", type);
    });

    document.getElementById("visuals-btn").addEventListener("click", () => runDesignTool("createVisualVariants"));
    document.getElementById("sentiment-btn").addEventListener("click", analyzeAndStyle);
    document.getElementById("highlight-btn").addEventListener("click", highlightPowerWords);

    // Close modal on outside click
    elements.settingsModal.addEventListener("click", (e) => {
        if (e.target === elements.settingsModal) closeSettings();
    });
}

function runDesignTool(funcName, arg) {
    // Determine complexity of argument to pass correctly
    // If arg is an object, stringify it safely for the script call
    var scriptArg = arg;
    if (typeof arg === 'object') {
        scriptArg = JSON.stringify(arg);
    }

    // Construct script: func('arg')
    // We need to escape single quotes if it's a string
    const safeArg = scriptArg ? `'${scriptArg.replace(/'/g, "\\'")}'` : "";
    const script = `${funcName}(${safeArg})`;

    csInterface.evalScript(script, (res) => {
        const result = JSON.parse(res);
        if (result.success) {
            // success
            if (result.sentiment) {
                // Optional: Show a toast? 
                console.log("Applied sentiment: " + result.sentiment);
            }
        } else {
            alert("Error: " + result.error);
        }
    });
}

// --- Shared API Helper with Robust Fallback ---
async function callGeminiAPI(promptText) {
    if (!currentApiKey) throw new Error("API Key missing. Check Settings.");

    // Candidates: currentModel first, then standard list
    let candidates = [currentModel, "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"].filter(Boolean);
    candidates = [...new Set(candidates)]; // Remove duplicates

    for (const model of candidates) {
        try {
            const url = `${BASE_URL}/models/${model}:generateContent?key=${currentApiKey}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                currentModel = model; // Update global preference on success
                return data;
            }
        } catch (e) {
            console.warn(`Model ${model} failed interactively.`);
        }
    }

    // Ultimate Fallback: Query API for available models
    console.log("Hardcoded models failed. Querying available models...");
    try {
        const listResponse = await fetch(`${BASE_URL}/models?key=${currentApiKey}`);
        if (!listResponse.ok) throw new Error("List models failed");

        const listData = await listResponse.json();
        const validModel = listData.models?.find(m =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            !m.name.includes("vision") // Prefer text-optimized if possible
        );

        if (validModel) {
            const modelName = validModel.name.replace("models/", "");
            console.log(`Discovered working model: ${modelName}`);

            const url = `${BASE_URL}/models/${modelName}:generateContent?key=${currentApiKey}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (response.ok) {
                currentModel = modelName;
                return await response.json();
            }
        }
    } catch (e) {
        console.warn("Dynamic fallback failed:", e);
    }

    throw new Error("Unable to connect to any Gemini model. Please check your API Key and Region.");
}

async function analyzeAndStyle() {
    // 1. Get Text from AE
    const btn = document.getElementById("sentiment-btn");
    const originalText = btn.innerHTML;

    const getLayerText = () => new Promise((resolve, reject) => {
        csInterface.evalScript("getSelectedTextLayerContent()", (res) => {
            const data = JSON.parse(res);
            if (data.error) reject(data.error);
            else resolve(data.text);
        });
    });

    try {
        btn.innerHTML = `⏳ Reading...`;
        const text = await getLayerText();

        btn.innerHTML = `🔮 AI Thinking...`;

        const prompt = `
        Analyze the emotion of this game UI text: "${text}"
        
        Return a JSON object for visual styling based on the emotion.
        
        Output Format:
        {
            "sentiment": "One word summary (e.g. Danger, Victory, Calm)",
            "fillColor": [R, G, B], // Array of 3 floats between 0.0 and 1.0 (Red=1,0,0)
            "strokeColor": [R, G, B], // Array or null
            "strokeWidth": Number, // Px (e.g. 5)
            "tracking": Number // (e.g. 0, 100)
        }

        Style Guide:
        - Urgent/Danger | "Warning", "Boss": Red/Orange ([1, 0.2, 0.2]), thick stroke, tight tracking (0).
        - Victory/Premium | "Win", "Success": Gold/Yellow ([1, 0.84, 0]), wide tracking (100).
        - Calm/Info | "Relax", "Settings": Blue/Cyan ([0.2, 0.8, 1]), no stroke, normal tracking (50).
        - Magic/Fantasy | "Mana", "Spell": Purple/Pink ([0.8, 0.2, 1]), thin stroke.
        - Default: White ([1,1,1]), no stroke.
        `;

        const data = await callGeminiAPI(prompt);
        const resultText = data.candidates[0].content.parts[0].text;
        const styleData = JSON.parse(resultText);

        btn.innerHTML = `✨ Applying...`;

        // Run the script
        runDesignTool("applySentimentStyle", styleData);

    } catch (e) {
        alert("AI Style Error: " + e.message);
    } finally {
        setTimeout(() => { btn.innerHTML = originalText; }, 1000);
    }
}

async function highlightPowerWords() {
    const btn = document.getElementById("highlight-btn");
    const originalText = btn.innerHTML;

    // Helper to get text promise
    const getLayerText = () => new Promise((resolve, reject) => {
        csInterface.evalScript("getSelectedTextLayerContent()", (res) => {
            const data = JSON.parse(res);
            if (data.error) reject(data.error);
            else resolve(data.text);
        });
    });

    try {
        btn.innerHTML = `⏳ ...`;
        const text = await getLayerText();

        btn.innerHTML = `🧠 Finding...`;

        const prompt = `
        Identify the 1 to 3 most important "Power Words" (keywords) in this game ad text. 
        These are words like "Free", "Epic", "Win", "Legendary", "Now".
        
        Text: "${text}"
        
        Return ONLY a JSON Array of strings. Example: ["Epic", "Win"]
        `;

        const data = await callGeminiAPI(prompt);
        const resultText = data.candidates[0].content.parts[0].text;

        // Clean up markdown code blocks if present (```json ... ```)
        const cleanJson = resultText.replace(/```json|```/g, "").trim();
        const words = JSON.parse(cleanJson);

        btn.innerHTML = `🖍️ Highlighting...`;

        // Run the script
        runDesignTool("applyPowerHighlight", words);

    } catch (e) {
        alert("Highlight Error: " + e.message);
    } finally {
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 1000);
    }
}

async function smartWrapText() {
    const btn = document.getElementById("wrap-btn");
    const originalText = btn.innerHTML;

    // Reuse helper to get text
    const getLayerText = () => new Promise((resolve, reject) => {
        csInterface.evalScript("getSelectedTextLayerContent()", (res) => {
            const data = JSON.parse(res);
            if (data.error) reject(data.error);
            else resolve(data.text);
        });
    });

    try {
        btn.innerHTML = `⏳ ...`;
        const text = await getLayerText();

        btn.innerHTML = `📐 Balancing...`;

        const prompt = `
        Rewrite this sentence into a balanced, stacked layout (2 to 4 lines max) by inserting newline characters (\\n) at logical phrase breaks.
        The goal is to make it visually pleasing and centered.
        
        Input: "${text}"
        
        Output: The raw text string with newlines. NO JSON. NO MARKDOWN. Just the text.
        Example Input: "Play the best RPG game of 2025 now for free"
        Example Output: 
        Play the best
        RPG game of 2025
        Now for Free
        `;

        const data = await callGeminiAPI(prompt);
        let resultText = data.candidates[0].content.parts[0].text;

        // Clean potential markdown or quotes
        resultText = resultText.replace(/^"|"$/g, '').trim();

        btn.innerHTML = `✨ Wrapping...`;

        // Run the script
        runDesignTool("applySmartWrap", resultText);

    } catch (e) {
        alert("Wrap Error: " + e.message);
    } finally {
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 1000);
    }
}



function loadSettings() {
    if (currentApiKey) {
        elements.apiKeyInput.value = currentApiKey;
    } else {
        openSettings();
    }
}

function openSettings() {
    elements.settingsModal.classList.add("active");
}

function closeSettings() {
    elements.settingsModal.classList.remove("active");
}

function saveSettings() {
    const key = elements.apiKeyInput.value.trim();
    if (key) {
        currentApiKey = key;
        localStorage.setItem("smart_copy_api_key", key);
        closeSettings();
        alert("API Key saved!");
    } else {
        alert("Please enter a valid API Key.");
    }
}

function updateLayerSelection() {
    csInterface.evalScript("getSelectedTextLayerContent()", (result) => {
        try {
            const data = JSON.parse(result);
            if (data.error) {
                elements.draftText.value = "";
                elements.draftText.placeholder = data.error + " Please select a text layer.";
                elements.generateBtn.disabled = true;
            } else {
                elements.draftText.value = data.text;
                elements.generateBtn.disabled = false;
            }
        } catch (e) {
            console.error("Error parsing AE result:", e);
        }
    });
}

async function runDiagnostics() {
    if (!currentApiKey) {
        alert("Enter API Key first.");
        return;
    }

    elements.draftText.value = "🔍 Analyzing API connection and available models...\n";

    try {
        const response = await fetch(`${BASE_URL}/models?key=${currentApiKey}`);
        const data = await response.json();

        if (data.error) {
            elements.draftText.value += `\n❌ Error: ${data.error.message}`;
            return;
        }

        if (!data.models) {
            elements.draftText.value += `\n❌ No models returned. Check API Key permissions.`;
            return;
        }

        elements.draftText.value += `\n✅ Connection Successful! Found ${data.models.length} models.\n\nAvailable Models:`;

        // Find a suitable model to switch to
        const generateModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

        generateModels.forEach(m => {
            elements.draftText.value += `\n- ${m.name}`;
        });

        // Auto-select best available
        const preferred = ["models/gemini-1.5-flash", "models/gemini-1.5-pro", "models/gemini-pro"];
        const found = preferred.find(p => generateModels.some(m => m.name === p));

        if (found) {
            currentModel = found.replace("models/", ""); // Strip prefix if needed for some calls, but usually keeping it is fine.
            // Actually generateContent endpoint needs "models/modelname:generateContent" or "modelname:generateContent"
            // The list returns "models/gemini-pro".
            // My fetchURL builder was `models/${model}:generateContent`
            // If I set currentModel to "gemini-1.5-flash", it works.
            // If I set it to "models/gemini-1.5-flash", the url would be `models/models/gemini...` -> wrong.
            // So we strip "models/".
            currentModel = found.split("/")[1];
            elements.draftText.value += `\n\n🎯 Auto-Configured to use: ${currentModel}`;
        }

    } catch (e) {
        elements.draftText.value += `\n❌ Network/Fetch Error: ${e.toString()}`;
    }
}

async function handleGenerate() {
    if (!currentApiKey) {
        openSettings();
        return;
    }

    const draft = elements.draftText.value;
    if (!draft) return;

    setLoading(true);
    elements.resultsContainer.innerHTML = "";

    try {
        const variants = await fetchGeminiEnhancements(draft);
        renderVariants(variants);
    } catch (e) {
        alert("Error: " + e.message);
        // Show detailed error in textarea for debugging
        elements.draftText.value = `Draft: ${draft}\n\nFAILED: ${e.message}`;
        console.error(e);
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        elements.generateBtn.disabled = true;
        elements.generateBtn.innerHTML = `<div class="loading-spinner"></div> Generating...`;
    } else {
        elements.generateBtn.disabled = false;
        elements.generateBtn.innerHTML = `<span>✨ Analyze & Improve</span>`;
    }
}

async function fetchGeminiEnhancements(draftText) {
    const prompt = `
Role: Senior Game Copywriter.
Task: Analyze this draft text and generate 4 high-converting, punchy iterations for a mobile game ad.

Draft: "${draftText}"

Requirements:
- "Short & Snappy": High energy, max 2 lines.
- "Gameplay/Challenge": Focus on skill/ego.
- "Immersion/Fantasy": Story/atmosphere.
- "FOMO/Social": Urgency/events.

Output JSON Structure:
{
  "variants": [
    { "type": "Short & Snappy", "text": "..." },
    { "type": "Gameplay/Challenge", "text": "..." },
    { "type": "Immersion/Fantasy", "text": "..." },
    { "type": "FOMO/Social", "text": "..." }
  ]
}
`;
    // Use the shared helper
    const data = await callGeminiAPI(prompt);
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
}

function renderVariants(data) {
    data.variants.forEach(variant => {
        const card = document.createElement("div");
        card.className = "variant-card";

        const cardContent = `
            <div class="variant-header">
                <span class="variant-title">${variant.type}</span>
            </div>
            <div class="variant-text">${variant.text}</div>
            <div class="variant-actions">
                <button class="secondary-btn apply-btn">Apply to Layer</button>
                <button class="secondary-btn copy-btn">Copy Text</button>
            </div>
        `;

        card.innerHTML = cardContent;
        elements.resultsContainer.appendChild(card);

        // Bind Actions
        const applyBtn = card.querySelector(".apply-btn");
        applyBtn.addEventListener("click", () => applyToLayer(variant.text));

        const copyBtn = card.querySelector(".copy-btn");
        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(variant.text);
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = "Copy Text", 1500);
        });
    });
}

function applyToLayer(text) {
    const safeText = JSON.stringify(text);
    csInterface.evalScript(`replaceSelectedTextLayerContent(${safeText})`, (res) => {
        const result = JSON.parse(res);
        if (!result.success) {
            alert("Error: " + result.error);
        }
    });
}

// Start
init();
