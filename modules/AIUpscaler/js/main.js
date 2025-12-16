const csInterface = new CSInterface();
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

// State
let selectedFilePath = null;
let currentResultPath = null;
let isProcessing = false;

// DOM Elements
const btnGetLayer = document.getElementById('btn-get-layer');
const btnUpscale = document.getElementById('btn-upscale');
const btnImport = document.getElementById('btn-import');
const fileDisplayKey = document.getElementById('file-name');
const scaleInput = document.getElementById('scale-factor');
const scaleValue = document.getElementById('scale-value');
const faceEnhanceInput = document.getElementById('face-enhance');
const apiKeyInput = document.getElementById('api-key');
const resultSection = document.getElementById('result-section');
const resultPreview = document.getElementById('result-preview');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const toast = document.getElementById('toast');

// Settings Modal Elements
const btnSettings = document.getElementById('btn-settings');
const modal = document.getElementById('settings-modal');
const btnCloseSettings = document.getElementById('close-settings');
const btnSaveSettings = document.getElementById('save-settings');

// Load API Key
const apiKey = localStorage.getItem('replicate_api_key') || '';
apiKeyInput.value = apiKey;

// Modal Logic
btnSettings.addEventListener('click', () => {
    modal.classList.remove('hidden');
});

btnCloseSettings.addEventListener('click', () => {
    modal.classList.add('hidden');
});

btnSaveSettings.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('replicate_api_key', key);
        showToast("API Key saved!");
        modal.classList.add('hidden');
    } else {
        showToast("Please enter a valid key.");
    }
});

// Settings
scaleInput.addEventListener('input', (e) => {
    scaleValue.textContent = e.target.value + 'x';
});

// Helper: Show Toast
function showToast(msg, duration = 3000) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// Helper: Convert File to Base64
function fileToBase64(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const bitmap = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase().replace('.', '');
            const mime = ext === 'jpg' ? 'jpeg' : ext;
            const b64 = Buffer.from(bitmap).toString('base64');
            resolve(`data:image/${mime};base64,${b64}`);
        } catch (e) {
            reject(e);
        }
    });
}

// Helper: Download File
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(destPath));
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { }); // Delete the file async
            reject(err);
        });
    });
}

// 1. Get Selected Layer
btnGetLayer.addEventListener('click', () => {
    csInterface.evalScript('getSelectedImage()', (result) => {
        try {
            const data = JSON.parse(result);
            if (data.error) {
                showToast(data.error);
                return;
            }
            selectedFilePath = data.path;
            fileDisplayKey.textContent = data.name;
            fileDisplayKey.title = data.path;

            // Enable upscale if API key is present (or check later)
            btnUpscale.disabled = false;
        } catch (e) {
            console.error(e);
            showToast("Error parsing layer data.");
        }
    });
});

// 2. Upscale
btnUpscale.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showToast("Please enter a Replicate API Token");
        return;
    }

    if (!selectedFilePath) {
        showToast("No file selected");
        return;
    }

    setLoading(true, "Preparing image...");

    try {
        // Read file
        const imageBase64 = await fileToBase64(selectedFilePath);

        setLoading(true, "Uploading to AI...");

        // Start Prediction
        const prediction = await createPrediction(apiKey, {
            image: imageBase64,
            scale: parseFloat(scaleInput.value),
            face_enhance: faceEnhanceInput.checked
        });

        if (prediction.error) {
            throw new Error(prediction.error);
        }

        const predictionId = prediction.id;
        let status = prediction.status;
        let outputUrl = null;

        // Poll
        while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s
            const statusUrl = prediction.urls.get;
            const update = await getPredictionStatus(apiKey, statusUrl);
            status = update.status;
            setLoading(true, `Processing: ${status}...`);

            if (status === 'succeeded') {
                outputUrl = update.output;
            } else if (status === 'failed') {
                throw new Error("Upscaling failed on server.");
            }
        }

        if (outputUrl) {
            setLoading(true, "Downloading result...");
            // Save to temp
            const tempDir = os.tmpdir();
            const fileName = `upscaled_${Date.now()}.png`;
            const destPath = path.join(tempDir, fileName);

            await downloadFile(outputUrl, destPath);
            currentResultPath = destPath;

            // Show result
            resultPreview.src = destPath; // Local path works in CEP
            resultSection.classList.remove('hidden');

            // Scroll to bottom
            setTimeout(() => {
                resultSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }

    } catch (e) {
        console.error(e);
        showToast("Error: " + e.message);
    } finally {
        setLoading(false);
    }
});

// 3. Import
btnImport.addEventListener('click', () => {
    if (!currentResultPath) return;

    const name = `Upscaled_${path.basename(selectedFilePath)}`;
    // Escape backslashes for Windows paths in ExtendScript string
    const escapedPath = currentResultPath.replace(/\\/g, '\\\\');

    csInterface.evalScript(`importUpscaledImage('${escapedPath}', '${name}')`, (res) => {
        try {
            const data = JSON.parse(res);
            if (data.success) {
                showToast("Imported successfully!");
            } else {
                showToast(data.error);
            }
        } catch (e) {
            showToast("Import failed.");
        }
    });
});

// API Helpers
async function createPrediction(token, inputs) {
    // Model: nightmareai/real-esrgan
    // We can use the generic models endpoint
    const response = await fetch("https://api.replicate.com/v1/models/nightmareai/real-esrgan/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            input: inputs
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || response.statusText);
    }
    return response.json();
}

async function getPredictionStatus(token, url) {
    const response = await fetch(url, {
        headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        throw new Error("Failed to check status");
    }
    return response.json();
}

function setLoading(active, text = "Processing...") {
    if (active) {
        loader.classList.remove('hidden');
        loaderText.textContent = text;
        isProcessing = true;
        btnUpscale.disabled = true;
    } else {
        loader.classList.add('hidden');
        isProcessing = false;
        btnUpscale.disabled = false;
    }
}
