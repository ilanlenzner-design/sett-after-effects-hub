// State Management
const state = {
    geminiKey: localStorage.getItem('gemini_api_key') || '',
    elevenLabsKey: localStorage.getItem('elevenlabs_api_key') || '',
    mode: 'text', // 'text' or 'remix'
    prompt: '',
    duration: 2.0,
    uploadedFile: null, // { name, type, data (base64) }
    isPlaying: null, // ID of currently playing sound
    history: []
};

// DOM Elements
const elements = {
    apiKeySection: document.getElementById('api-key-section'),
    appSection: document.getElementById('app-section'),
    geminiKeyInput: document.getElementById('gemini-api-key-input'),
    elevenLabsKeyInput: document.getElementById('elevenlabs-api-key-input'),
    saveKeysBtn: document.getElementById('save-api-keys-btn'),

    modeTextBtn: document.getElementById('mode-text-btn'),
    modeRemixBtn: document.getElementById('mode-remix-btn'),
    textModeContent: document.getElementById('text-mode-content'),
    remixModeContent: document.getElementById('remix-mode-content'),

    promptInput: document.getElementById('prompt-input'),
    enhancePromptBtn: document.getElementById('enhance-prompt-btn'),
    surpriseMeBtn: document.getElementById('surprise-me-btn'),

    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    uploadPlaceholder: document.getElementById('upload-placeholder'),
    fileInfo: document.getElementById('file-info'),
    fileName: document.getElementById('file-name'),
    uploadPreview: document.getElementById('upload-preview'),
    analysisResult: document.getElementById('analysis-result'),
    analysisText: document.getElementById('analysis-text'),

    durationInput: document.getElementById('duration-input'),
    durationValue: document.getElementById('duration-value'),
    generateBtn: document.getElementById('generate-btn'),

    loadingSection: document.getElementById('loading-section'),
    loadingText: document.getElementById('loading-text'),
    errorMessage: document.getElementById('error-message'),
    historyList: document.getElementById('history-list'),

    mainAudio: document.getElementById('main-audio')
};

// Initialization
function init() {
    if (state.geminiKey && state.elevenLabsKey) {
        elements.geminiKeyInput.value = state.geminiKey;
        elements.elevenLabsKeyInput.value = state.elevenLabsKey;
        showApp();
    } else {
        showApiKeys();
    }

    setupEventListeners();
}

function setupEventListeners() {
    // API Keys
    elements.saveKeysBtn.addEventListener('click', saveApiKeys);

    // Mode Switching
    elements.modeTextBtn.addEventListener('click', () => setMode('text'));
    elements.modeRemixBtn.addEventListener('click', () => setMode('remix'));

    // Text Mode
    elements.promptInput.addEventListener('input', (e) => state.prompt = e.target.value);
    elements.enhancePromptBtn.addEventListener('click', enhancePrompt);
    elements.surpriseMeBtn.addEventListener('click', surpriseMe);

    // Remix Mode
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);
    elements.uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); elements.uploadArea.style.borderColor = '#4f46e5'; });
    elements.uploadArea.addEventListener('dragleave', (e) => { e.preventDefault(); elements.uploadArea.style.borderColor = '#334155'; });
    elements.uploadArea.addEventListener('drop', handleFileDrop);

    // Controls
    elements.durationInput.addEventListener('input', (e) => {
        state.duration = parseFloat(e.target.value);
        elements.durationValue.textContent = state.duration + 's';
    });

    elements.generateBtn.addEventListener('click', generateSound);

    // Audio Player
    elements.mainAudio.addEventListener('ended', () => {
        state.isPlaying = null;
        updateHistoryUI();
    });
}

// Logic Functions

function saveApiKeys() {
    const gKey = elements.geminiKeyInput.value.trim();
    const eKey = elements.elevenLabsKeyInput.value.trim();

    if (!gKey || !eKey) {
        showError('Please enter both API keys.');
        return;
    }

    state.geminiKey = gKey;
    state.elevenLabsKey = eKey;
    localStorage.setItem('gemini_api_key', gKey);
    localStorage.setItem('elevenlabs_api_key', eKey);

    showApp();
}

function setMode(mode) {
    state.mode = mode;

    if (mode === 'text') {
        elements.modeTextBtn.classList.add('active');
        elements.modeRemixBtn.classList.remove('active');
        elements.textModeContent.style.display = 'block';
        elements.remixModeContent.style.display = 'none';
        elements.generateBtn.textContent = 'Generate Sound FX';
    } else {
        elements.modeTextBtn.classList.remove('active');
        elements.modeRemixBtn.classList.add('active');
        elements.textModeContent.style.display = 'none';
        elements.remixModeContent.style.display = 'block';
        elements.generateBtn.textContent = 'Generate 3 Variations';
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    processFile(file);
}

function handleFileDrop(e) {
    e.preventDefault();
    elements.uploadArea.style.borderColor = '#334155';
    const file = e.dataTransfer.files[0];
    processFile(file);
}

function processFile(file) {
    if (!file || !file.type.startsWith('audio/')) {
        showError('Please upload a valid audio file.');
        return;
    }

    if (file.size > 4 * 1024 * 1024) {
        showError('File is too large. Max 4MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        state.uploadedFile = {
            name: file.name,
            type: file.type || 'audio/mpeg',
            data: e.target.result.split(',')[1] // base64
        };

        elements.uploadPlaceholder.style.display = 'none';
        elements.fileInfo.style.display = 'flex';
        elements.fileName.textContent = file.name;
        elements.uploadPreview.src = URL.createObjectURL(file);

        // Reset analysis
        elements.analysisResult.style.display = 'none';
        state.prompt = ''; // Clear prompt for remix mode
    };
    reader.readAsDataURL(file);
}

// API Calls

async function enhancePrompt() {
    if (!state.prompt) return;

    showLoading('Enhancing prompt...');
    try {
        const enhanced = await callGeminiText(
            "You are an expert sound designer. Rewrite the user's input into a highly descriptive, detailed audio prompt. Focus on timbre and materials. Keep it under 30 words. Output ONLY the prompt text.",
            state.prompt
        );
        state.prompt = enhanced;
        elements.promptInput.value = enhanced;
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

async function surpriseMe() {
    showLoading('Thinking...');
    try {
        const creative = await callGeminiText(
            "Generate a unique sound effect description for a movie. Output ONLY the description, under 20 words.",
            "Generate a sound effect idea."
        );
        state.prompt = creative;
        elements.promptInput.value = creative;
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

async function generateSound() {
    elements.errorMessage.style.display = 'none';

    if (state.mode === 'text') {
        if (!state.prompt) {
            showError('Please describe the sound effect.');
            return;
        }

        showLoading('Generating sound...');
        try {
            const base64Audio = await callElevenLabs(state.prompt, state.duration);
            addHistoryItem(state.prompt, base64Audio);
        } catch (err) {
            showError(err.message);
        } finally {
            hideLoading();
        }
    } else {
        // Remix Mode
        if (!state.uploadedFile) {
            showError('Please upload an audio file first.');
            return;
        }

        showLoading('Analyzing audio...');
        try {
            // 1. Analyze
            const analysis = await callGeminiMultimodal(
                "Listen to this audio file. Describe the sound effect in detail, focusing on the object, texture, action, and mood. Output ONLY a descriptive prompt suitable for a text-to-audio generator (under 25 words).",
                state.uploadedFile.data,
                state.uploadedFile.type
            );

            elements.analysisText.textContent = analysis;
            elements.analysisResult.style.display = 'block';

            // 2. Generate Variations
            showLoading('Generating 3 variations...');

            const promises = [1, 2, 3].map(() => callElevenLabs(analysis, state.duration));
            const results = await Promise.all(promises);

            results.forEach((audio, i) => {
                addHistoryItem(`Remix #${i + 1}: ${analysis}`, audio);
            });

        } catch (err) {
            showError(err.message);
        } finally {
            hideLoading();
        }
    }
}

// API Helpers

async function callGeminiText(system, user) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: user }] }],
            systemInstruction: { parts: [{ text: system }] }
        })
    });

    if (!response.ok) throw new Error('Gemini API Error');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response";
}

async function callGeminiMultimodal(prompt, base64Data, mimeType) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mimeType, data: base64Data } }
                ]
            }]
        })
    });

    if (!response.ok) throw new Error('Gemini Vision Error');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No analysis";
}

async function callElevenLabs(text, duration) {
    const url = 'https://api.elevenlabs.io/v1/sound-generation';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'xi-api-key': state.elevenLabsKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            duration_seconds: duration,
            prompt_influence: 0.3
        })
    });

    if (!response.ok) throw new Error('ElevenLabs API Error');
    const blob = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    });
}

// UI Helpers

function showApp() {
    elements.apiKeySection.style.display = 'none';
    elements.appSection.style.display = 'block';
}

function showApiKeys() {
    elements.apiKeySection.style.display = 'block';
    elements.appSection.style.display = 'none';
}

function showLoading(text) {
    elements.loadingText.textContent = text;
    elements.loadingSection.style.display = 'block';
    elements.generateBtn.disabled = true;
}

function hideLoading() {
    elements.loadingSection.style.display = 'none';
    elements.generateBtn.disabled = false;
}

function showError(msg) {
    elements.errorMessage.textContent = msg;
    elements.errorMessage.style.display = 'block';
    setTimeout(() => elements.errorMessage.style.display = 'none', 5000);
}

function addHistoryItem(prompt, base64Audio) {
    const id = Date.now() + Math.random();
    const url = `data:audio/mpeg;base64,${base64Audio}`;

    const item = { id, prompt, url, timestamp: new Date().toLocaleTimeString() };
    state.history.unshift(item);

    renderHistory();
    playSound(id, url);
}

function renderHistory() {
    elements.historyList.innerHTML = '';
    state.history.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${state.isPlaying === item.id ? 'playing' : ''}`;
        div.innerHTML = `
            <button class="play-btn" onclick="togglePlay('${item.id}', '${item.url}')">
                ${state.isPlaying === item.id
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>'}
            </button>
            <div class="history-info">
                <p class="history-prompt" title="${item.prompt}">${item.prompt}</p>
                <p class="history-meta">${item.timestamp}</p>
            </div>
            <div class="actions">
                <button class="action-btn import-btn" onclick="importToAE('${item.id}')" title="Import to After Effects">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
                <a href="${item.url}" download="sfx.mp3" class="action-btn" title="Download">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </a>
            </div>
        `;
        elements.historyList.appendChild(div);
    });
}

// Global functions for HTML event handlers
window.togglePlay = (id, url) => {
    if (state.isPlaying === id) {
        elements.mainAudio.pause();
        state.isPlaying = null;
    } else {
        playSound(id, url);
    }
    renderHistory();
};

function playSound(id, url) {
    elements.mainAudio.src = url;
    elements.mainAudio.play();
    state.isPlaying = id;
    renderHistory();
}

window.importToAE = (id) => {
    const item = state.history.find(i => i.id == id);
    if (!item) return;

    if (!window.__adobe_cep__) {
        alert('This feature is only available inside After Effects.');
        return;
    }

    const csInterface = new CSInterface();
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const tempDir = os.tmpdir();
    const fileName = `sfx_${Date.now()}.mp3`;
    const filePath = path.join(tempDir, fileName);

    try {
        const buffer = Buffer.from(item.url.split(',')[1], 'base64');
        fs.writeFileSync(filePath, buffer);

        const escapedPath = filePath.replace(/\\/g, "\\\\");
        const script = `importAudio('${escapedPath}', '${item.prompt.substring(0, 30).replace(/'/g, "")}')`;

        csInterface.evalScript(script, (result) => {
            const res = JSON.parse(result);
            if (res.status === 'success') {
                // Optional: Show success toast
            } else {
                showError('Import Failed: ' + res.message);
            }
        });
    } catch (err) {
        showError('File Error: ' + err.message);
    }
};

// Start
init();
