// Main application logic
(function () {
    'use strict';

    // Initialize CSInterface
    const csInterface = new CSInterface();

    // State
    let currentLayerInfo = null;
    let currentVideoPath = null;
    let generatedVideoPath = null;

    // DOM elements
    let elements = {};

    // Initialize on load
    function init() {
        // Get DOM elements
        elements = {
            settingsBtn: document.getElementById('settingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            geminiKey: document.getElementById('geminiKey'),
            runwayKey: document.getElementById('runwayKey'),
            saveSettings: document.getElementById('saveSettings'),
            layerInfo: document.getElementById('layerInfo'),
            refreshLayer: document.getElementById('refreshLayer'),
            styleInput: document.getElementById('styleInput'),
            generateBtn: document.getElementById('generateBtn'),
            btnText: document.getElementById('btnText'),
            btnLoader: document.getElementById('btnLoader'),
            statusContainer: document.getElementById('statusContainer'),
            statusMessages: document.getElementById('statusMessages'),
            resultContainer: document.getElementById('resultContainer'),
            resultVideo: document.getElementById('resultVideo'),
            importBtn: document.getElementById('importBtn')
        };

        // Load saved API keys
        loadApiKeys();

        // Attach event listeners
        attachEventListeners();

        // Load ExtendScript
        loadExtendScript();
    }

    /**
     * Load ExtendScript functions - now embedded for reliability
     */
    function loadExtendScript() {
        console.log('Loading ExtendScript functions...');
        // ExtendScript is now embedded in each function call for reliability
        // Initial layer refresh
        setTimeout(refreshSelectedLayer, 500);
    }

    /**
     * Load API keys from config
     */
    function loadApiKeys() {
        elements.geminiKey.value = Config.getGeminiKey();
        elements.runwayKey.value = Config.getRunwayKey();
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        // Settings toggle
        elements.settingsBtn.addEventListener('click', () => {
            elements.settingsPanel.classList.toggle('hidden');
        });

        // Save settings
        elements.saveSettings.addEventListener('click', saveSettings);

        // Refresh layer
        elements.refreshLayer.addEventListener('click', refreshSelectedLayer);

        // Generate button
        elements.generateBtn.addEventListener('click', handleGenerate);

        // Import button
        elements.importBtn.addEventListener('click', importToAfterEffects);
    }

    /**
     * Save API settings
     */
    function saveSettings() {
        Config.saveGeminiKey(elements.geminiKey.value.trim());
        Config.saveRunwayKey(elements.runwayKey.value.trim());

        showStatus('Settings saved successfully!', 'success');

        // Close settings panel
        setTimeout(() => {
            elements.settingsPanel.classList.add('hidden');
        }, 500);
    }

    /**
     * Refresh selected layer info
     */
    function refreshSelectedLayer() {
        // ExtendScript doesn't have JSON.stringify - build JSON manually
        const script = `
            var result;
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    result = '{"error":"No active composition"}';
                } else if (comp.selectedLayers.length === 0) {
                    result = '{"error":"No layer selected"}';
                } else {
                    var layer = comp.selectedLayers[0];
                    if (!(layer instanceof AVLayer)) {
                        result = '{"error":"Selected layer is not a video/footage layer"}';
                    } else if (!layer.source) {
                        result = '{"error":"Layer has no source"}';
                    } else {
                        // Build JSON string manually
                        result = '{"name":"' + layer.name.replace(/"/g, '\\\\"') + '",' +
                                 '"startTime":' + layer.startTime + ',' +
                                 '"duration":' + layer.source.duration + ',' +
                                 '"inPoint":' + layer.inPoint + ',' +
                                 '"outPoint":' + layer.outPoint + ',' +
                                 '"width":' + layer.source.width + ',' +
                                 '"height":' + layer.source.height + '}';
                    }
                }
            } catch (error) {
                result = '{"error":"Exception: ' + error.toString().replace(/"/g, '\\\\"') + '"}';
            }
            result;
        `;

        csInterface.evalScript(script, (result) => {
            console.log('getSelectedLayer result:', result);

            try {
                if (!result || result === '' || result === 'null' || result === 'undefined' || result === 'EvalScript error.') {
                    displayLayerInfo(null, 'ExtendScript error - check DevTools console');
                    console.error('ExtendScript returned:', result);
                    return;
                }

                const layerInfo = JSON.parse(result);

                // Check if it's an error object
                if (layerInfo.error) {
                    displayLayerInfo(null, layerInfo.error);
                    return;
                }

                displayLayerInfo(layerInfo);
            } catch (error) {
                console.error('Error parsing layer info:', error);
                console.error('Raw result:', result);
                displayLayerInfo(null, 'Parse error: ' + error.message + ' (Check DevTools)');
            }
        });
    }

    /**
     * Display layer information
     */
    function displayLayerInfo(layerInfo, errorMessage = null) {
        currentLayerInfo = layerInfo;

        if (!layerInfo || errorMessage) {
            const message = errorMessage || 'No layer selected';
            elements.layerInfo.innerHTML = `<p class="placeholder">⚠️ ${message}</p>`;
            elements.generateBtn.disabled = true;
            return;
        }

        elements.layerInfo.innerHTML = `
            <div>
                <p class="layer-name">📹 ${layerInfo.name}</p>
                <p class="layer-details">Duration: ${layerInfo.duration.toFixed(2)}s | Start: ${layerInfo.startTime.toFixed(2)}s</p>
            </div>
        `;

        elements.generateBtn.disabled = false;
    }

    /**
     * Handle video generation
     */
    async function handleGenerate() {
        // Validate inputs
        if (!currentLayerInfo) {
            alert('Please select a video layer in After Effects');
            return;
        }

        const style = elements.styleInput.value.trim();
        if (!style) {
            alert('Please enter a style or prompt');
            return;
        }

        if (!Config.hasAllKeys()) {
            alert('Please configure API keys in settings');
            elements.settingsPanel.classList.remove('hidden');
            return;
        }

        // Reset UI
        elements.resultContainer.classList.add('hidden');
        elements.statusContainer.classList.remove('hidden');
        elements.statusMessages.innerHTML = '';

        // Disable generate button
        setGenerateButtonLoading(true);

        try {
            // Step 1: Export video from After Effects
            showStatus('Exporting video from After Effects...', 'info');
            currentVideoPath = await exportLayerVideo();
            showStatus(`Video exported: ${currentVideoPath}`, 'success');

            // Step 2: Generate prompt with Gemini
            showStatus('Analyzing video with Gemini...', 'info');
            const prompt = await GeminiService.generatePrompt(currentVideoPath, style);
            showStatus(`Generated prompt: "${prompt.substring(0, 100)}..."`, 'success');

            // Step 3: Generate video with Runway
            showStatus('Starting Runway video generation...', 'info');

            // Calculate ratio from layer info
            const ratio = currentLayerInfo ? `${currentLayerInfo.width}:${currentLayerInfo.height}` : '1280:768';
            console.log('Using ratio:', ratio);

            generatedVideoPath = await RunwayService.generateVideo(
                currentVideoPath,
                prompt,
                ratio,
                showStatus
            );

            // Step 4: Show result
            showStatus('✅ Video generation complete!', 'success');
            displayResult(generatedVideoPath);

        } catch (error) {
            console.error('Generation error:', error);
            showStatus(`❌ Error: ${error.message}`, 'error');
        } finally {
            setGenerateButtonLoading(false);
        }
    }

    /**
     * Export layer as video
     */
    function exportLayerVideo() {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "Error: No active composition";
                        }
                        if (comp.selectedLayers.length === 0) {
                            return "Error: No layer selected";
                        }
                        var layer = comp.selectedLayers[0];
                        if (!(layer instanceof AVLayer) || !layer.source) {
                            return "Error: Selected layer is not an AV layer";
                        }
                        if (!(layer.source instanceof FootageItem)) {
                            return "Error: Layer source is not a footage item";
                        }
                        var footage = layer.source;
                        if (footage.file) {
                            return footage.file.fsName;
                        }
                        return "Error: Layer source doesn't have a file. Please use a video file layer.";
                    } catch (error) {
                        return "Error: " + error.toString();
                    }
                })();
            `;

            csInterface.evalScript(script, (result) => {
                try {
                    if (result === 'null' || !result || result.startsWith('Error:')) {
                        reject(new Error(result || 'Failed to export video'));
                        return;
                    }
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Display generated video result
     */
    function displayResult(videoPath) {
        elements.resultContainer.classList.remove('hidden');

        // Convert file path to file:// URL for video element
        const videoUrl = 'file://' + videoPath;
        elements.resultVideo.src = videoUrl;
        elements.resultVideo.load();
    }

    /**
     * Import generated video to After Effects
     */
    function importToAfterEffects() {
        if (!generatedVideoPath) {
            alert('No generated video to import');
            return;
        }

        const script = `
            (function() {
                try {
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        return "Error: No active composition";
                    }
                    var importOptions = new ImportOptions(new File("${generatedVideoPath.replace(/\\/g, '\\\\')}"));
                    if (!importOptions.file.exists) {
                        return "Error: Video file does not exist";
                    }
                    var footage = app.project.importFile(importOptions);
                    if (!footage) {
                        return "Error: Failed to import video file";
                    }
                    var newLayer = comp.layers.add(footage);
                    newLayer.moveToBeginning();
                    for (var i = 1; i <= comp.selectedLayers.length; i++) {
                        comp.selectedLayers[i - 1].selected = false;
                    }
                    newLayer.selected = true;
                    return "success";
                } catch (error) {
                    return "Error: " + error.toString();
                }
            })();
        `;

        csInterface.evalScript(script, (result) => {
            if (result === 'success') {
                showStatus('Video imported to After Effects!', 'success');
                alert('Video has been imported and added to your composition!');
            } else {
                showStatus(`Import failed: ${result}`, 'error');
                alert('Failed to import video: ' + result);
            }
        });
    }

    /**
     * Show status message
     */
    function showStatus(message, type = 'info') {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;

        elements.statusMessages.appendChild(statusDiv);
        elements.statusMessages.scrollTop = elements.statusMessages.scrollHeight;
    }

    /**
     * Set generate button loading state
     */
    function setGenerateButtonLoading(loading) {
        elements.generateBtn.disabled = loading;

        if (loading) {
            elements.btnText.classList.add('hidden');
            elements.btnLoader.classList.remove('hidden');
        } else {
            elements.btnText.classList.remove('hidden');
            elements.btnLoader.classList.add('hidden');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
