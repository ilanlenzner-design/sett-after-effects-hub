// Initialize CSInterface
const csInterface = new CSInterface();
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// DOM Elements
let fileInput;
let uploadArea;
let previewImage;
let generateBtn;
let replicateKeyInput;
let saveReplicateKeyBtn;
let progressSection;
let progressFill;
let progressText;
let resultsSection;
let resultsGrid;
let errorMessage;
let preserveColorsCheckbox;
let preserveCompositionCheckbox;
let modelSelect;
let settingsBtn;
let apiKeySection;

// State
let currentImage = null;
let replicateKey = null;
let selectedModel = 'nano-banana';
let selectedVariation = null; // Store selected variation data

// Model configurations
const MODELS = {
    'sdxl': {
        name: 'SDXL',
        owner: 'stability-ai',
        model: 'sdxl',
        version: '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
        supportsImage: true,
        imageParam: 'image',
        params: {
            num_inference_steps: 30,
            guidance_scale: 7.5
        }
    },
    'nano-banana': {
        name: 'Nano Banana',
        owner: 'google',
        model: 'nano-banana',
        version: null, // Use latest via owner/model endpoint
        supportsImage: true,
        imageParam: 'image_input',
        params: {
            num_inference_steps: 25,
            guidance_scale: 4.0
        }
    },
    'seedream-4': {
        name: 'SeedDream 4',
        owner: 'bytedance',
        model: 'seedream-4',
        version: null,
        supportsImage: true,
        imageParam: 'image_input',
        params: {
            num_inference_steps: 25,
            guidance_scale: 5.0
        }
    },
    'imagen-4-fast': {
        name: 'Imagen 4 Fast',
        owner: 'google',
        model: 'imagen-4-fast',
        version: null,
        supportsImage: false,
        params: {
            num_inference_steps: 20,
            guidance_scale: 3.0
        }
    },
    'ideogram-v3-quality': {
        name: 'Ideogram v3 Quality',
        owner: 'ideogram-ai',
        model: 'ideogram-v3-quality',
        version: null,
        supportsImage: false,
        params: {
            num_inference_steps: 30,
            guidance_scale: 3.5
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Get DOM elements
    fileInput = document.getElementById('fileInput');
    uploadArea = document.getElementById('uploadArea');
    previewImage = document.getElementById('previewImage');
    generateBtn = document.getElementById('generateBtn');
    replicateKeyInput = document.getElementById('replicateKey');
    saveReplicateKeyBtn = document.getElementById('saveReplicateKey');
    progressSection = document.getElementById('progressSection');
    progressFill = document.getElementById('progressFill');
    progressText = document.getElementById('progressText');
    resultsSection = document.getElementById('resultsSection');
    resultsGrid = document.getElementById('results');
    errorMessage = document.getElementById('errorMessage');
    preserveColorsCheckbox = document.getElementById('preserveColors');
    preserveCompositionCheckbox = document.getElementById('preserveComposition');
    modelSelect = document.getElementById('modelSelect');

    // New Elements
    settingsBtn = document.getElementById('settingsBtn');
    apiKeySection = document.getElementById('apiKeySection');

    // Hide API key section by default
    if (apiKeySection) apiKeySection.style.display = 'none';

    // Load saved API key
    loadReplicateKey();

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // API Key
    saveReplicateKeyBtn.addEventListener('click', saveReplicateKey);

    // Settings Button
    if (settingsBtn) {
        settingsBtn.addEventListener('click', toggleSettings);
    }

    document.getElementById('openReplicate').addEventListener('click', (e) => {
        e.preventDefault();
        csInterface.openURLInDefaultBrowser('https://replicate.com/account/api-tokens');
    });

    // Upload area
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Generate button
    generateBtn.addEventListener('click', generateVariations);

    // Model selection
    modelSelect.addEventListener('change', (e) => {
        selectedModel = e.target.value;
        console.log('Model changed to:', MODELS[selectedModel].name);
    });
}

function toggleSettings() {
    if (!apiKeySection) return;

    const currentDisplay = apiKeySection.style.display;
    if (currentDisplay === 'none' || currentDisplay === '') {
        apiKeySection.style.display = 'block';
    } else {
        apiKeySection.style.display = 'none';
    }
}

function loadReplicateKey() {
    let stored = localStorage.getItem('replicate_api_key');
    if (stored) {
        // Sanitize key just in case
        stored = stored.replace(/^export\s+REPLICATE_API_TOKEN=/, '').trim();
        // Remove quotes if present
        stored = stored.replace(/^["']|["']$/g, '');

        replicateKey = stored;
        replicateKeyInput.value = stored;
    }
}

function saveReplicateKey() {
    let key = replicateKeyInput.value.trim();

    // Sanitize input
    key = key.replace(/^export\s+REPLICATE_API_TOKEN=/, '').trim();
    key = key.replace(/^["']|["']$/g, '');

    if (key && key.startsWith('r8_')) {
        replicateKey = key;
        replicateKeyInput.value = key; // Show cleaned key
        localStorage.setItem('replicate_api_key', key);
        showMessage('Replicate API key saved successfully', 'success');

        // Hide settings after save
        if (apiKeySection) apiKeySection.style.display = 'none';

        updateGenerateButton();
    } else {
        showError('Invalid key. It must start with "r8_"');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        loadImage(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        loadImage(files[0]);
    }
}

function loadImage(file) {
    // Validate file type
    if (!file.type.match('image.*')) {
        showError('Please select a valid image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = {
            data: e.target.result,
            name: file.name,
            type: file.type
        };

        // Show preview
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        document.querySelector('.upload-placeholder').style.display = 'none';

        updateGenerateButton();
    };
    reader.readAsDataURL(file);
}

function updateGenerateButton() {
    generateBtn.disabled = !(currentImage && replicateKey);
}

async function generateVariations() {
    if (!currentImage || !replicateKey) {
        showError('Please provide your Replicate API key and upload an image');
        return;
    }

    try {
        // Hide error, show progress
        hideError();
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        generateBtn.disabled = true;

        // Generate variations with SeedDream-4
        updateProgress(10, 'Preparing to generate variations...');
        const variations = await generateWithSeedDream(currentImage.data);

        // Display results
        updateProgress(100, 'Complete!');
        displayResults(variations);

        setTimeout(() => {
            progressSection.style.display = 'none';
            generateBtn.disabled = false;
        }, 500);

    } catch (error) {
        console.error('Error generating variations:', error);
        showError(error.message || 'Failed to generate variations');
        progressSection.style.display = 'none';
        generateBtn.disabled = false;
    }
}

async function generateWithSeedDream(imageData) {
    const variations = [];
    const preserveColors = preserveColorsCheckbox.checked;
    const preserveComposition = preserveCompositionCheckbox.checked;

    // Generate 4 variations using ByteDance SeedDream-4
    const basePrompts = [
        preserveColors && preserveComposition ?
            "Create a subtle variation maintaining the same color palette and composition" :
            preserveColors ?
                "Create a variation with the same colors but different composition and arrangement" :
                preserveComposition ?
                    "Create a variation with different colors but similar composition and layout" :
                    "Create a creative variation with different colors and new composition",

        "Generate an artistic reinterpretation" +
        (preserveColors ? " keeping the original color scheme" : "") +
        (preserveComposition ? " with similar layout" : ""),

        "Produce a fresh take" +
        (preserveColors ? " preserving color harmony" : " with bold new colors") +
        (preserveComposition ? " maintaining the structure" : " with new arrangement"),

        "Create a unique version" +
        (preserveColors ? " using the same palette" : " with creative color changes") +
        (preserveComposition ? " keeping the composition" : " exploring new layouts")
    ];

    for (let i = 0; i < 4; i++) {
        updateProgress(10 + (i * 20), `Generating variation ${i + 1}/4...`);

        // Add delay between requests to handle rate limiting
        if (i > 0) {
            updateProgress(10 + (i * 20), `Waiting for rate limit... (${10 - (i * 2)}s)`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between requests
        }

        try {
            // Get selected model config
            const modelConfig = MODELS[selectedModel];

            // Prepare request body
            const requestBody = {
                input: {
                    prompt: basePrompts[i],
                    num_inference_steps: modelConfig.params.num_inference_steps,
                    guidance_scale: modelConfig.params.guidance_scale,
                    seed: Math.floor(Math.random() * 1000000)
                }
            };

            // Add version if it exists (for models like SDXL using specific version)
            if (modelConfig.version) {
                requestBody.version = modelConfig.version;
            }

            // Add image input only if model supports it
            if (modelConfig.supportsImage) {
                const imageParamName = modelConfig.imageParam || 'image';
                // Some models (like Nano Banana) expect an array of images for image_input
                if (imageParamName === 'image_input') {
                    requestBody.input[imageParamName] = [imageData];
                } else {
                    requestBody.input[imageParamName] = imageData;
                }
            }

            console.log(`Creating SeedDream prediction ${i + 1}...`, { prompt: basePrompts[i] });
            console.log('Using Replicate Key:', replicateKey ? `Present (ends with ...${replicateKey.slice(-4)})` : 'MISSING');

            // Determine API endpoint based on whether model has version
            const apiUrl = modelConfig.version
                ? 'https://api.replicate.com/v1/predictions'
                : `https://api.replicate.com/v1/models/${modelConfig.owner}/${modelConfig.model}/predictions`;

            console.log(`Using API URL: ${apiUrl}`);

            let createResponse;
            let networkRetries = 3;

            while (networkRetries > 0) {
                try {
                    createResponse = await nodeFetch(
                        apiUrl,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${replicateKey}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'wait'
                            },
                            body: JSON.stringify(requestBody)
                        }
                    );
                    break; // Success, exit retry loop
                } catch (err) {
                    console.error(`Network error attempt ${4 - networkRetries}:`, err);
                    networkRetries--;
                    if (networkRetries === 0) throw err;
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                }
            }

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                console.error(`Replicate API error for variation ${i + 1}:`, createResponse.status, createResponse.statusText, JSON.stringify(errorData));

                // Handle rate limiting with retry
                if (errorData.status === 429 && errorData.retry_after) {
                    const retryDelay = (errorData.retry_after + 1) * 1000; // Add 1 second buffer
                    console.log(`Rate limited. Retrying in ${errorData.retry_after}s...`);
                    updateProgress(10 + (i * 20), `Rate limited, waiting ${errorData.retry_after}s...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    i--; // Retry this iteration
                    continue;
                }

                continue;
            }

            const prediction = await createResponse.json();
            console.log(`Prediction ${i + 1} response:`, prediction);

            // If prediction completed immediately (Prefer: wait header)
            if (prediction.status === 'succeeded' && prediction.output) {
                // SDXL returns an array of URLs, get the first one
                const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
                console.log(`Fetching image from: ${imageUrl}`);

                // Fetch the image and convert to base64 with retry logic
                let imageResponse;
                let imageRetries = 3;

                while (imageRetries > 0) {
                    try {
                        imageResponse = await nodeFetch(imageUrl);
                        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
                        break;
                    } catch (err) {
                        console.error(`Image fetch error attempt ${4 - imageRetries}:`, err);
                        imageRetries--;
                        if (imageRetries === 0) throw err;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }

                const imageBlob = await imageResponse.blob();

                // Convert blob to base64
                const base64Image = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result.split(',')[1];
                        resolve(base64);
                    };
                    reader.readAsDataURL(imageBlob);
                });

                // Determine extension from URL pathname to handle query params and different extensions
                let extension = 'png';
                try {
                    const urlPath = new URL(imageUrl).pathname;
                    const ext = path.extname(urlPath).toLowerCase();
                    if (ext === '.jpg' || ext === '.jpeg') extension = 'jpg';
                    else if (ext === '.png') extension = 'png';
                    else if (ext === '.webp') extension = 'webp';
                } catch (e) {
                    console.error('Error parsing extension:', e);
                }

                variations.push({
                    image: base64Image,
                    prompt: basePrompts[i],
                    extension: extension
                });
                console.log(`Variation ${i + 1} added successfully`);
            } else if (prediction.status === 'processing' || prediction.status === 'starting') {
                // Poll for completion
                const finalPrediction = await pollPrediction(prediction.id);

                if (finalPrediction.status === 'succeeded' && finalPrediction.output) {
                    // SDXL returns an array of URLs, get the first one
                    const imageUrl = Array.isArray(finalPrediction.output) ? finalPrediction.output[0] : finalPrediction.output;
                    console.log(`Fetching image from: ${imageUrl}`);

                    // Fetch the image and convert to base64
                    const imageResponse = await nodeFetch(imageUrl);
                    const imageBlob = await imageResponse.blob();

                    const base64Image = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64 = reader.result.split(',')[1];
                            resolve(base64);
                        };
                        reader.readAsDataURL(imageBlob);
                    });

                    // Determine extension from URL pathname
                    let extension = 'png';
                    try {
                        const urlPath = new URL(imageUrl).pathname;
                        const ext = path.extname(urlPath).toLowerCase();
                        if (ext === '.jpg' || ext === '.jpeg') extension = 'jpg';
                        else if (ext === '.png') extension = 'png';
                        else if (ext === '.webp') extension = 'webp';
                    } catch (e) {
                        console.error('Error parsing extension:', e);
                    }

                    variations.push({
                        image: base64Image,
                        prompt: basePrompts[i],
                        extension: extension
                    });
                    console.log(`Variation ${i + 1} added successfully`);
                }
            }
        } catch (error) {
            console.error(`Error generating variation ${i + 1}:`, error);
        }
    }

    if (variations.length === 0) {
        throw new Error('No variations were generated. Please check your Replicate API key and try again.');
    }

    return variations;
}

async function pollPrediction(predictionId) {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await nodeFetch(
            `https://api.replicate.com/v1/predictions/${predictionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${replicateKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const prediction = await response.json();

        if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
            return prediction;
        }

        // Wait 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
    }

    throw new Error('Prediction timed out');
}

function displayResults(variations) {
    resultsGrid.innerHTML = '';
    selectedVariation = null; // Reset selection

    // Show import section but disable button
    const importSection = document.getElementById('importSection');
    const importBtn = document.getElementById('importBtn');
    if (importSection) importSection.style.display = 'block';
    if (importBtn) {
        importBtn.classList.remove('active');
        importBtn.onclick = () => {
            if (selectedVariation) {
                importImageToAE(selectedVariation.image, selectedVariation.index, selectedVariation.extension);
            }
        };
    }

    variations.forEach((variation, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        // Add click handler for selection
        resultItem.onclick = () => {
            // Remove selected class from all items
            document.querySelectorAll('.result-item').forEach(item => item.classList.remove('selected'));
            // Add selected class to clicked item
            resultItem.classList.add('selected');
            // Update state
            selectedVariation = { ...variation, index: index + 1 };
            // Enable import button
            if (importBtn) importBtn.classList.add('active');
        };

        const img = document.createElement('img');
        img.src = `data:image/png;base64,${variation.image}`;
        img.alt = `Variation ${index + 1}`;
        // Keep drag handler as alternative
        img.style.cursor = 'pointer';
        img.title = 'Click to select, Drag to import';

        // Add drag handler
        img.draggable = true;
        img.ondragstart = (event) => {
            // ... (keep existing drag logic)
            try {
                const os = require('os');
                const path = require('path');
                const fs = require('fs');

                const tempDir = os.tmpdir();
                const extension = variation.extension || 'png';
                const fileName = `generated_variation_${index + 1}.${extension}`;
                const filePath = path.join(tempDir, fileName);

                const buffer = Buffer.from(variation.image, 'base64');
                fs.writeFileSync(filePath, buffer);

                event.dataTransfer.setData('text/uri-list', 'file://' + filePath);
                event.dataTransfer.setData('text/plain', filePath);
                event.dataTransfer.effectAllowed = 'copy';
            } catch (e) {
                console.error('Error preparing drag:', e);
            }
        };

        resultItem.appendChild(img);

        // Add label
        const label = document.createElement('div');
        label.className = 'result-label';
        label.textContent = `Variation ${index + 1}`;
        resultItem.appendChild(label);

        resultsGrid.appendChild(resultItem);
    });

    resultsSection.style.display = 'block';
}

async function importImageToAE(base64Data, index, extension = 'png') {
    try {
        // Ensure Node.js modules are available
        const os = require('os');
        const path = require('path');
        const fs = require('fs');

        // Use a persistent temp folder in Documents to avoid cleanup issues
        const homeDir = os.homedir();
        const appTempDir = path.join(homeDir, 'Documents', 'AI_Image_Variations_Temp');

        if (!fs.existsSync(appTempDir)) {
            fs.mkdirSync(appTempDir, { recursive: true });
        }

        const timestamp = new Date().getTime();
        const fileName = `generated_variation_${index}_${timestamp}.${extension}`;
        const filePath = path.join(appTempDir, fileName);

        // Write file to disk
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved image to: ${filePath}`);

        // Call ExtendScript to import
        // We embed the script directly to avoid loading issues
        const escapedPath = filePath.replace(/\\/g, '\\\\');

        const script = `
            (function() {
                try {
                    var filePath = "${escapedPath}";
                    if (!filePath) return "Error: No file path";
                    
                    var file = new File(filePath);
                    if (!file.exists) return "Error: File not found at " + filePath;
                    
                    if (!app.project) app.newProject();
                    
                    var importOptions = new ImportOptions(file);
                    var importedItem = app.project.importFile(importOptions);
                    
                    if (!importedItem) return "Error: Import failed";
                    
                    var activeComp = app.project.activeItem;
                    if (activeComp && activeComp instanceof CompItem) {
                        activeComp.layers.add(importedItem);
                        return "Success: Added to active comp";
                    } else {
                        // Create new comp
                        var compName = importedItem.name.replace(/\\.[^\\.]+$/, "");
                        var newComp = app.project.items.addComp(compName, importedItem.width, importedItem.height, importedItem.pixelAspect, 10, 30);
                        newComp.layers.add(importedItem);
                        newComp.openInViewer();
                        return "Success: Created new comp";
                    }
                } catch(e) {
                    return "Error: " + e.toString();
                }
            })();
        `;

        console.log('Executing inline ExtendScript...');

        csInterface.evalScript(script, (result) => {
            console.log('ExtendScript result:', result);
            if (result && result.toString().startsWith('Success')) {
                showMessage('Image imported successfully!', 'success');
            } else {
                showMessage('Failed to import. Result: ' + result, 'error');
                console.error('Import failed with result:', result);
            }
        });

    } catch (err) {
        console.error('Error importing image:', err);
        showMessage('Error importing image: ' + err.message, 'error');
    }
}

function downloadImage(base64Image, filename) {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Image}`;
    link.download = filename;
    link.click();
}

function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function showMessage(message, type) {
    // Simple notification - could be enhanced
    const msg = document.createElement('div');
    msg.className = type === 'success' ? 'success-message' : 'error-message';
    msg.textContent = message;
    msg.style.display = 'block';
    document.querySelector('.container').prepend(msg);

    setTimeout(() => {
        msg.remove();
    }, 3000);
}

function nodeFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);

        const headers = { ...(options.headers || {}) };
        if (options.body) {
            headers['Content-Length'] = Buffer.byteLength(options.body);
        }

        const requestOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: headers,
        };

        console.log('nodeFetch request:', {
            url,
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname,
            method: requestOptions.method,
            headers: { ...headers, Authorization: headers.Authorization ? 'Bearer ...' : 'MISSING' }
        });

        const req = https.request(requestOptions, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    json: () => Promise.resolve(JSON.parse(buffer.toString())),
                    text: () => Promise.resolve(buffer.toString()),
                    blob: () => Promise.resolve(new Blob([buffer]))
                });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

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
