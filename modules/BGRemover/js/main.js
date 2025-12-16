// BG Remover - Main Application Logic using Replicate API

const fs = require('fs');
const path = require('path');

let currentSourceData = null;
let processedImageData = null;
let replicateApiKey = '';
let csInterface = null;

// ExtendScript code as string (inline) - v5
const extendScript = `
// Get selected layer file path
function getLayer() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({error: "No active composition"});
        }
        
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            return JSON.stringify({error: "No layer selected"});
        }
        
        var layer = selectedLayers[0];
        var layerSource = layer.source;
        
        if (!layerSource || !(layerSource instanceof FootageItem)) {
            return JSON.stringify({error: "Layer must be footage (image/video)"});
        }
        
        var sourceFile = layerSource.file;
        if (!sourceFile || !sourceFile.exists) {
            return JSON.stringify({error: "Source file not found"});
        }
        
        return JSON.stringify({
            filePath: sourceFile.fsName,
            layerName: layer.name,
            width: layerSource.width,
            height: layerSource.height
        });
    } catch (e) {
        return JSON.stringify({error: e.toString()});
    }
}

// Simple test function
function testFunction() {
    return "TEST_SUCCESS";
}

// Import Base64 image
function importBase64Image(base64Data, fileName) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            comp = app.project.items.addComp("New Composition", 1920, 1080, 1.0, 10.0, 30);
        }
        
        var tempFolder = Folder.temp;
        var tempFile = new File(tempFolder.fsName + "/" + fileName);
        
        tempFile.encoding = "BINARY";
        tempFile.open("w");
        tempFile.write(decodeBase64(base64Data));
        tempFile.close();
        
        var importOptions = new ImportOptions(tempFile);
        var footage = app.project.importFile(importOptions);
        var layer = comp.layers.add(footage);
        layer.position.setValue([comp.width / 2, comp.height / 2]);
        
        tempFile.remove();
        
        return JSON.stringify({success: true, layerName: layer.name});
    } catch (e) {
        return JSON.stringify({error: e.toString()});
    }
}

function decodeBase64(input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\\+\\/\\=]/g, "");
    
    while (i < input.length) {
        var enc1 = keyStr.indexOf(input.charAt(i++));
        var enc2 = keyStr.indexOf(input.charAt(i++));
        var enc3 = keyStr.indexOf(input.charAt(i++));
        var enc4 = keyStr.indexOf(input.charAt(i++));
        
        var chr1 = (enc1 << 2) | (enc2 >> 4);
        var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        var chr3 = ((enc3 & 3) << 6) | enc4;
        
        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) output = output + String.fromCharCode(chr2);
        if (enc4 != 64) output = output + String.fromCharCode(chr3);
    }
    return output;
}
`;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('BG Remover extension loaded');
    csInterface = new CSInterface();
    loadSettings();
    setupEventListeners();

    // Test if hostscript.jsx loaded
    setTimeout(() => {
        csInterface.evalScript('typeof getLayer', (result) => {
            console.log('getLayer type:', result);
            if (result !== 'function') {
                console.error('hostscript.jsx not loaded!');
            }
        });
    }, 500);
});

function setupEventListeners() {
    document.getElementById('settingsBtn').addEventListener('click', toggleSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('getSelectedLayer').addEventListener('click', getSelectedLayer);
    document.getElementById('processBtn').addEventListener('click', processImage);
    document.getElementById('importBtn').addEventListener('click', importToAE);
}

function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.style.display = settingsPanel.style.display !== 'none' ? 'none' : 'block';
}

function loadSettings() {
    const saved = localStorage.getItem('bgRemoverSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        replicateApiKey = settings.replicateApiKey || '';
        document.getElementById('replicateApiKey').value = replicateApiKey;
    }
}

function saveSettings() {
    replicateApiKey = document.getElementById('replicateApiKey').value.trim();

    if (!replicateApiKey || !replicateApiKey.startsWith('r8_')) {
        showError('Invalid API key. Should start with "r8_"');
        return;
    }

    localStorage.setItem('bgRemoverSettings', JSON.stringify({ replicateApiKey }));
    showSuccess('Settings saved!');
    setTimeout(() => toggleSettings(), 1000);
}


function getSelectedLayer() {
    console.log('Getting selected layer...');

    // First test basic return
    csInterface.evalScript('testFunction()', (testResult) => {
        console.log('Test result:', testResult);

        if (testResult !== 'TEST_SUCCESS') {
            showError('ExtendScript return values not working. Got: ' + testResult);
            return;
        }

        // Now call the real function
        csInterface.evalScript('getLayer()', (result) => {
            console.log('Raw result:', result);

            if (!result || result.trim() === '' || result === 'EvalScript error.') {
                showError('ExtendScript error. Check After Effects Console window.');
                return;
            }

            try {
                const response = JSON.parse(result);

                if (response.error) {
                    showError(response.error);
                    return;
                }

                console.log('File path:', response.filePath);

                const fileBuffer = fs.readFileSync(response.filePath);
                const base64 = fileBuffer.toString('base64');

                const ext = path.extname(response.filePath).toLowerCase();
                const mimeType = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : 'image/png';

                currentSourceData = {
                    imageData: base64,
                    layerName: response.layerName,
                    width: response.width,
                    height: response.height,
                    mimeType: mimeType
                };

                document.getElementById('sourcePreview').innerHTML =
                    `<img src="data:${mimeType};base64,${base64}" alt="Source">`;

                document.getElementById('sourceInfo').innerHTML = `
                    <strong>Layer:</strong> ${response.layerName}<br>
                    <strong>Size:</strong> ${response.width} × ${response.height}px
                `;

                document.getElementById('processBtn').disabled = false;
                showSuccess('Layer loaded!');

            } catch (e) {
                console.error('Error:', e);
                showError('Error: ' + e.message);
            }
        });
    });
}

async function processImage() {
    if (!currentSourceData) {
        showError('No image loaded');
        return;
    }

    if (!replicateApiKey) {
        showError('Configure API key first');
        toggleSettings();
        return;
    }

    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const statusText = document.getElementById('statusText');

    progressContainer.style.display = 'block';
    progressFill.style.width = '20%';
    statusText.textContent = 'Uploading...';
    document.getElementById('processBtn').disabled = true;

    try {
        const imageDataUrl = `data:${currentSourceData.mimeType};base64,${currentSourceData.imageData}`;

        progressFill.style.width = '30%';
        statusText.textContent = 'Creating prediction...';
        // Create prediction
        // Using "cjwbw/rembg" which is stable and reliable for background removal
        // Version: fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003
        const prediction = await createPrediction(imageDataUrl, 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003');

        if (!prediction || !prediction.id) {
            throw new Error('Failed to create prediction');
        }

        progressFill.style.width = '50%';
        statusText.textContent = 'Processing...';

        const result = await pollPrediction(prediction.id, (p) => {
            progressFill.style.width = `${50 + p * 40}%`;
        });

        progressFill.style.width = '90%';
        statusText.textContent = 'Downloading...';

        const imageBase64 = await downloadImageAsBase64(result.output);
        processedImageData = imageBase64;

        document.getElementById('resultPreview').innerHTML =
            `<img src="data:image/png;base64,${imageBase64}" alt="Result">`;

        document.getElementById('importBtn').disabled = false;

        progressFill.style.width = '100%';
        statusText.textContent = 'Complete!';

        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressFill.style.width = '0%';
        }, 2000);

        showSuccess('Background removed!');

    } catch (error) {
        console.error(error);
        showError('Failed: ' + error.message);
        progressContainer.style.display = 'none';
    } finally {
        document.getElementById('processBtn').disabled = false;
    }
}

// Create Replicate Prediction
async function createPrediction(imageDataUrl, version) {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${replicateApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: version,
            input: {
                image: imageDataUrl
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

async function pollPrediction(predictionId, onProgress) {
    for (let i = 0; i < 60; i++) {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { 'Authorization': `Token ${replicateApiKey}` }
        });

        const prediction = await response.json();

        if (prediction.status === 'succeeded') return prediction;
        if (prediction.status === 'failed') throw new Error(prediction.error || 'Failed');
        if (prediction.status === 'canceled') throw new Error('Canceled');

        if (onProgress) onProgress(i / 60);
        await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error('Timeout');
}

async function downloadImageAsBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Import Result to After Effects
function importToAE() {
    if (!processedImageData) {
        showError('No processed image to import');
        return;
    }

    console.log('Saving image locally before import...');

    try {
        // Create a persistent path for the image
        const userDataPath = csInterface.getSystemPath(SystemPath.USER_DATA);
        const fileName = 'bg_removed_' + Date.now() + '.png';
        const filePath = path.join(userDataPath, fileName);

        console.log('Saving to:', filePath);

        // Write file using Node.js (much faster/reliable than ExtendScript)
        const buffer = Buffer.from(processedImageData, 'base64');
        fs.writeFileSync(filePath, buffer);

        if (!fs.existsSync(filePath)) {
            throw new Error('Failed to save image file');
        }

        console.log('File saved, importing to AE...');

        // Pass ONLY the path to ExtendScript
        // Escape backslashes for Windows, though we are on Mac
        const safePath = filePath.replace(/\\/g, '\\\\');
        const scriptCall = `importFile('${safePath}')`;

        csInterface.evalScript(scriptCall, (result) => {
            console.log('Import result:', result);

            if (!result || result === 'EvalScript error.') {
                showError('ExtendScript error during import');
                return;
            }

            try {
                // Handle potential non-JSON response or errors
                if (result.indexOf('error') !== -1) {
                    // Try to parse if it looks like JSON
                    if (result.trim().startsWith('{')) {
                        const response = JSON.parse(result);
                        if (response.error) {
                            showError(response.error);
                            return;
                        }
                    } else {
                        showError('Import failed: ' + result);
                        return;
                    }
                }

                showSuccess('Image imported successfully!');

            } catch (e) {
                console.error('Import parse error:', e);
                // If it didn't return an explicit error string, assume success if the call didn't fail
                showSuccess('Image imported!');
            }
        });

    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to save image: ' + error.message);
    }
}

function showError(message) {
    console.error('ERROR:', message);
    const container = document.querySelector('.main-content');
    const existing = container.querySelector('.error-message');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'error-message';
    div.textContent = message;
    container.insertBefore(div, container.firstChild);
    setTimeout(() => div.remove(), 5000);
}

function showSuccess(message) {
    console.log('SUCCESS:', message);
    const container = document.querySelector('.main-content');
    const existing = container.querySelector('.success-message');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'success-message';
    div.textContent = message;
    container.insertBefore(div, container.firstChild);
    setTimeout(() => div.remove(), 3000);
}
