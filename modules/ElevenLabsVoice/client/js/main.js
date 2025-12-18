// Main Logic (Service loaded via script tag)

// Main Logic
(function () {
    'use strict';

    const csInterface = new CSInterface();
    const elevenLabs = new ElevenLabsService();

    // Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings');
    const apiKeyInput = document.getElementById('api-key');
    const voiceSelect = document.getElementById('voice-select');
    const refreshVoicesBtn = document.getElementById('refresh-voices');
    const textInput = document.getElementById('text-input');
    const modelSelect = document.getElementById('model-select');
    const generateBtn = document.getElementById('generate-btn');
    const statusMsg = document.getElementById('status-message');
    const btnText = generateBtn.querySelector('.btn-text');
    const loader = generateBtn.querySelector('.loader');

    // Preview Elements
    const playPreviewBtn = document.getElementById('play-preview');
    const previewAudio = document.getElementById('voice-preview-audio');

    // State
    let voicesLoaded = false;
    let voicePreviews = {}; // Map: voiceId -> previewUrl

    // --- Initialization ---
    function init() {
        const storedKey = localStorage.getItem('elevenLabsApiKey');
        if (storedKey) {
            elevenLabs.setApiKey(storedKey);
            apiKeyInput.value = storedKey;
            loadVoices();
        } else {
            showStatus("Please set your API Key in Settings.", "error");
            openSettings();
        }
    }

    // --- Helpers ---
    function showStatus(msg, type = 'normal') {
        statusMsg.textContent = msg;
        statusMsg.className = 'status-msg ' + type;

        // Clear success messages after a few seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMsg.textContent = '';
                statusMsg.className = 'status-msg';
            }, 4000);
        }
    }

    function setLoading(isLoading) {
        generateBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    }

    function openSettings() {
        settingsModal.classList.remove('hidden');
    }

    function closeSettings() {
        settingsModal.classList.add('hidden');
    }

    // --- Actions ---

    async function loadVoices() {
        try {
            voiceSelect.innerHTML = '<option>Loading...</option>';
            voiceSelect.disabled = true;

            const voices = await elevenLabs.getVoices();

            voiceSelect.innerHTML = '';
            voicePreviews = {}; // Reset previews

            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.voice_id;
                option.textContent = voice.name;
                voiceSelect.appendChild(option);

                // Store preview URL if available
                if (voice.preview_url) {
                    voicePreviews[voice.voice_id] = voice.preview_url;
                }
            });

            voiceSelect.disabled = false;
            voicesLoaded = true;

            // Trigger change event to update preview button state
            voiceSelect.dispatchEvent(new Event('change'));

            showStatus('Voices loaded.', 'success');

        } catch (error) {
            console.error(error);
            voiceSelect.innerHTML = '<option>Error loading voices</option>';
            showStatus("Failed to load voices. Check API Key.", "error");
        }
    }

    async function handleGenerate() {
        const text = textInput.value.trim();
        const voiceId = voiceSelect.value;
        const modelId = modelSelect.value;

        if (!text) {
            showStatus("Please enter some text.", "error");
            return;
        }
        if (!voiceId || !voicesLoaded) {
            showStatus("Please select a valid voice.", "error");
            return;
        }

        setLoading(true);
        showStatus("Generating audio...", "normal");

        try {
            // 1. Generate Audio
            const audioBuffer = await elevenLabs.generateAudio(text, voiceId, modelId);

            // 2. Save to File
            const timestamp = new Date().getTime();
            const fileName = `voiceover_${timestamp}.mp3`;
            const savedPath = await elevenLabs.saveAudioFile(audioBuffer, fileName);

            showStatus("Importing to After Effects...", "normal");

            // 3. Import to After Effects
            // Escape backslashes for Windows paths if necessary, though getting system path usually handles it
            const cleanPath = savedPath.replace(/\\/g, '\\\\');

            csInterface.evalScript(`importAudioFile("${cleanPath}")`, (result) => {
                if (result.includes("Error") || result.includes("Failed")) {
                    showStatus(result, "error");
                } else {
                    showStatus("Success! Audio added to composition.", "success");
                }
                setLoading(false);
            });

        } catch (error) {
            console.error(error);
            showStatus(`Error: ${error.message}`, "error");
            setLoading(false);
        }
    }

    async function handlePlayPreview() {
        const voiceId = voiceSelect.value;
        const previewUrl = voicePreviews[voiceId];

        if (!previewUrl) {
            showStatus("No preview available for this voice.", "normal");
            return;
        }

        try {
            previewAudio.src = previewUrl;
            await previewAudio.play();
            showStatus("Playing preview...", "normal");

            // Optional: visual feedback during playback could go here
            // e.g., toggle icon to stop

        } catch (err) {
            console.error(err);
            showStatus("Failed to play preview.", "error");
        }
    }

    function updatePreviewButtonState() {
        const voiceId = voiceSelect.value;
        const hasPreview = !!voicePreviews[voiceId];
        if (playPreviewBtn) {
            playPreviewBtn.disabled = !hasPreview;
            if (!hasPreview && voicesLoaded) {
                playPreviewBtn.style.opacity = '0.5';
            } else {
                playPreviewBtn.style.opacity = '1';
            }
        }
    }

    // --- Event Listeners ---

    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);

    saveSettingsBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('elevenLabsApiKey', key);
            elevenLabs.setApiKey(key);
            closeSettings();
            showStatus("API Key saved.", "success");
            loadVoices();
        } else {
            showStatus("Please enter a valid key.", "error");
        }
    });

    refreshVoicesBtn.addEventListener('click', () => {
        if (!elevenLabs.apiKey) {
            openSettings();
            return;
        }
        loadVoices();
    });

    if (playPreviewBtn) {
        playPreviewBtn.addEventListener('click', handlePlayPreview);
    }

    voiceSelect.addEventListener('change', updatePreviewButtonState);

    generateBtn.addEventListener('click', handleGenerate);

    // Initial Run
    init();

})();

// --- Ultimate Custom Dropdown Implementation (Handles Dynamic Options) ---
(function () {
    function rebuildCustomSelect(selElmnt) {
        // Removed offsetParent check to allow replacing hidden native selects

        var container = selElmnt.closest('.custom-select-container');
        if (container) {
            var selected = container.querySelector('.custom-select-selected');
            var items = container.querySelector('.custom-select-items');
            if (selected) selected.remove();
            if (items) items.remove();
        } else {
            container = document.createElement("div");
            container.setAttribute("class", "custom-select-container");
            selElmnt.parentNode.insertBefore(container, selElmnt);
            container.appendChild(selElmnt);
        }

        var a = document.createElement("DIV");
        a.setAttribute("class", "custom-select-selected");
        var selectedText = selElmnt.options[selElmnt.selectedIndex] ? selElmnt.options[selElmnt.selectedIndex].innerHTML : "Select...";
        a.innerHTML = selectedText;
        container.appendChild(a);

        var b = document.createElement("DIV");
        b.setAttribute("class", "custom-select-items select-hide");

        for (var j = 0; j < selElmnt.length; j++) {
            var c = document.createElement("DIV");
            c.innerHTML = selElmnt.options[j].innerHTML;
            c.setAttribute("data-value", selElmnt.options[j].value);
            c.addEventListener("click", function (e) {
                var s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                var h = this.parentNode.previousSibling;
                for (var i = 0; i < s.length; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;
                        var event = new Event('change', { bubbles: true });
                        s.dispatchEvent(event);
                        break;
                    }
                }
                h.click();
            });
            b.appendChild(c);
        }
        container.appendChild(b);

        a.addEventListener("click", function (e) {
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });

        selElmnt.classList.add('replaced');
    }

    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
                if (mutation.target.tagName !== "SELECT") {
                    var selects = document.getElementsByTagName("select");
                    for (var i = 0; i < selects.length; i++) {
                        if (!selects[i].classList.contains('replaced')) rebuildCustomSelect(selects[i]);
                    }
                }
                if (mutation.target.tagName === "SELECT") {
                    rebuildCustomSelect(mutation.target);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", closeAllSelect);

    setTimeout(function () {
        var selects = document.getElementsByTagName("select");
        for (var i = 0; i < selects.length; i++) {
            rebuildCustomSelect(selects[i]);
        }
    }, 200);

    function closeAllSelect(elmnt) {
        var x = document.getElementsByClassName("custom-select-items");
        var y = document.getElementsByClassName("custom-select-selected");
        var arrNo = [];
        for (var i = 0; i < y.length; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i)
            } else {
                y[i].classList.remove("select-arrow-active");
            }
        }
        for (var i = 0; i < x.length; i++) {
            if (arrNo.indexOf(i)) {
                x[i].classList.add("select-hide");
            }
        }
    }
})();
