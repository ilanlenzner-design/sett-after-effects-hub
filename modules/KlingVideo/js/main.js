const path = require('path');
const csInterface = new CSInterface();
const extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION);

// Resolve correctly relative to the bundled root (sett-hub)
const servicePath = path.join(extensionRoot, 'modules/KlingVideo/js/services/klingService.js');

// Force reload of the service module by clearing cache
if (require.cache[servicePath]) {
    delete require.cache[servicePath];
}

const KlingService = require(servicePath);

(function () {
    'use strict';

    // Globals
    // csInterface is already defined at top level
    let startLayerInfo = null;
    let endLayerInfo = null;
    let generatedVideoPath = null;

    // UI Elements
    const elements = {
        settingsBtn: document.getElementById('settingsBtn'),
        settingsPanel: document.getElementById('settingsPanel'),
        apiKeyInput: document.getElementById('apiKeyInput'),
        modeSelect: document.getElementById('modeSelect'),
        durationSelect: document.getElementById('durationSelect'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),

        // Start/End Frame UI
        setStartBtn: document.getElementById('setStartBtn'),
        startLayerInfo: document.getElementById('startLayerInfo'),

        setEndBtn: document.getElementById('setEndBtn'),
        endLayerInfo: document.getElementById('endLayerInfo'),
        clearEndBtn: document.getElementById('clearEndBtn'),

        layerSelectionSection: document.getElementById('layerSelectionSection'),

        promptInput: document.getElementById('promptInput'),
        negativePromptInput: document.getElementById('negativePromptInput'),
        generateBtn: document.getElementById('generateBtn'),
        statusArea: document.getElementById('statusArea'),
        resultArea: document.getElementById('resultArea'),
        resultVideo: document.getElementById('resultVideo'),
        importBtn: document.getElementById('importBtn')
    };

    // Constants
    const STORAGE_KEY_API_KEY = 'kling_replicate_api_key';

    let initialized = false;
    function init() {
        if (initialized) return;
        initialized = true;

        console.log('Kling Extension initializing...');
        loadApiKey();
        loadExtendScript();
        attachEventListeners();

        // Init Custom Dropdowns - Handled by IIFE now
        // initCustomSelects(); 

        // Initial layer check
        setTimeout(refreshLayer, 500);
    }

    // Ensure DOM is fully loaded befor running init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function loadExtendScript() {
        const scriptPath = path.join(extensionRoot, 'modules/KlingVideo/jsx/hostscript.jsx');
        csInterface.evalScript(`$.evalFile("${scriptPath}")`);
    }

    function attachEventListeners() {
        elements.settingsBtn.addEventListener('click', () => {
            elements.settingsPanel.classList.toggle('hidden');
        });

        elements.saveSettingsBtn.addEventListener('click', saveSettings);

        elements.modeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            if (mode === 't2v') {
                elements.layerSelectionSection.classList.add('hidden');
            } else {
                elements.layerSelectionSection.classList.remove('hidden');
            }
            checkGenerateReady();
        });

        // Frame Setters
        elements.setStartBtn.addEventListener('click', () => setLayer('start'));
        elements.setEndBtn.addEventListener('click', () => setLayer('end'));
        elements.clearEndBtn.addEventListener('click', () => clearLayer('end'));

        elements.generateBtn.addEventListener('click', handleGenerate);

        elements.importBtn.addEventListener('click', handleImport);
    }

    function setLayer(type) {
        csInterface.evalScript('getSelectedLayerInfo()', (result) => {
            try {
                const info = JSON.parse(result);
                if (info.error) {
                    alert(info.error);
                } else {
                    updateLayerUI(type, info);
                }
            } catch (e) {
                console.error('Error parsing layer info', e);
            }
        });
    }

    function clearLayer(type) {
        updateLayerUI(type, null);
    }

    function updateLayerUI(type, info) {
        const isStart = type === 'start';
        const box = isStart ? elements.startLayerInfo : elements.endLayerInfo;

        if (info) {
            if (isStart) startLayerInfo = info;
            else endLayerInfo = info;

            const filename = info.sourcePath ? info.sourcePath.split(/[\\/]/).pop() : 'Unknown File';

            box.classList.remove('empty');
            box.innerHTML = `
                <div style="font-weight:600; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;" title="${info.name}">${info.name}</div>
                <div style="color:#aaa; font-size:10px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;" title="${filename}">${filename}</div>
             `;

            if (!isStart) elements.clearEndBtn.classList.remove('hidden');

        } else {
            if (isStart) startLayerInfo = null;
            else endLayerInfo = null;

            box.classList.add('empty');
            box.innerHTML = `<p>No Layer Set</p>`;

            if (!isStart) elements.clearEndBtn.classList.add('hidden');
        }

        // Check valid state for button
        checkGenerateReady();
    }

    function checkGenerateReady() {
        const mode = elements.modeSelect.value;
        if (mode === 'i2v' && (!startLayerInfo || !startLayerInfo.sourcePath)) {
            elements.generateBtn.disabled = true;
        } else {
            elements.generateBtn.disabled = false;
        }
    }

    // Stub definition to avoid crashing if referenced, though we replaced it
    function refreshLayer() { }

    function saveSettings() {
        const key = elements.apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem(STORAGE_KEY_API_KEY, key);
            KlingService.init(key);
            alert('API Key Saved');
            elements.settingsPanel.classList.add('hidden');
        }
    }

    function loadApiKey() {
        const key = localStorage.getItem(STORAGE_KEY_API_KEY);
        if (key) {
            elements.apiKeyInput.value = key;
            KlingService.init(key);
            console.log('API Key loaded');
        }
        checkGenerateReady();
    }

    function appendStatus(msg) {
        elements.statusArea.classList.remove('hidden');
        const p = document.createElement('div');
        p.textContent = `> ${msg}`;
        elements.statusArea.appendChild(p);
        elements.statusArea.scrollTop = elements.statusArea.scrollHeight;
    }

    async function handleGenerate() {
        const prompt = elements.promptInput.value.trim();
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }

        const mode = elements.modeSelect.value;
        const duration = parseInt(elements.durationSelect.value);
        let sourcePath = null;

        if (mode === 'i2v') {
            if (!startLayerInfo || !startLayerInfo.sourcePath) {
                alert('No valid Start Frame set for Image-to-Video');
                return;
            }
            sourcePath = startLayerInfo.sourcePath;
        }

        const apiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
        if (!apiKey) {
            alert('Please set Replicate API Key in settings');
            elements.settingsPanel.classList.remove('hidden');
            return;
        }

        // Re-init just in case
        KlingService.init(apiKey);

        elements.generateBtn.disabled = true;
        elements.statusArea.innerHTML = ''; // Clear status
        elements.resultArea.classList.add('hidden');

        try {
            appendStatus(`Preparing generation (${mode.toUpperCase()}, ${duration}s)...`);

            const negativePrompt = elements.negativePromptInput.value.trim();
            const endPath = (mode === 'i2v' && endLayerInfo) ? endLayerInfo.sourcePath : null;

            // 1. Generate Video
            const videoUrl = await KlingService.generateVideo(
                sourcePath, // Pass null if T2V
                prompt,
                negativePrompt,
                duration,
                appendStatus,
                endPath // New Parameter
            );

            appendStatus('Video generated! downloading...');

            // 2. Download Video
            generatedVideoPath = await KlingService.downloadVideo(videoUrl, appendStatus);

            appendStatus(`Saved to: ${generatedVideoPath}`);

            // 3. Show Result
            elements.resultVideo.src = generatedVideoPath; // Assuming browser can view local path (CEP can if local file access allowed)
            // Note: in recent CEF, file:// URLs might be blocked unless --allow-file-access props.
            // But we can try.
            elements.resultArea.classList.remove('hidden');

        } catch (err) {
            console.error(err);
            appendStatus(`ERROR: ${err.message}`);
            alert(`Generation Failed: ${err.message}`);
        } finally {
            elements.generateBtn.disabled = false;
        }
    }

    function handleImport() {
        if (!generatedVideoPath) return;

        // Escape backslashes for ExtendScript
        // Mac uses forward slashes, but just in case
        const safePath = generatedVideoPath.replace(/\\/g, '\\\\');

        csInterface.evalScript(`importVideo("${safePath}")`, (result) => {
            if (result === 'success') {
                alert('Imported successfully!');
            } else {
                alert('Import failed: ' + result);
            }
        });
    }



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
