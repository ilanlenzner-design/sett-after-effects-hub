// State management
const state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    originalImage: null,
    originalImageData: null,
    analysis: null,
    variations: [],
    aspectRatio: '1:1'
};

// DOM Elements
const elements = {
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    selectBtn: document.getElementById('select-btn'),
    apiKeySection: document.getElementById('api-key-section'),
    apiKeyInput: document.getElementById('api-key-input'),
    saveApiKeyBtn: document.getElementById('save-api-key-btn'),
    uploadSection: document.getElementById('upload-section'),
    originalSection: document.getElementById('original-section'),
    originalImage: document.getElementById('original-image'),
    analysisText: document.getElementById('analysis-text'),
    keepColorsToggle: document.getElementById('keep-colors-toggle'),
    keepCompositionToggle: document.getElementById('keep-composition-toggle'),
    generateBtn: document.getElementById('generate-btn'),
    loadingSection: document.getElementById('loading-section'),
    loadingText: document.getElementById('loading-text'),
    variationsSection: document.getElementById('variations-section'),
    variationsGrid: document.getElementById('variations-grid'),
    newImageBtn: document.getElementById('new-image-btn')
};

// Initialize app
function init() {
    if (state.apiKey) {
        elements.apiKeyInput.value = state.apiKey;
        elements.apiKeySection.style.display = 'none';
    }

    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Upload area interactions
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.fileInput.click();
    });

    elements.fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);

    // API Key
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });

    // Generate variations
    elements.generateBtn.addEventListener('click', generateVariations);

    // New image
    elements.newImageBtn.addEventListener('click', resetApp);
}

// File handling
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

async function processFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    if (!state.apiKey) {
        alert('Please enter your Gemini API key first');
        return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = async (e) => {
        state.originalImageData = e.target.result;
        state.originalImage = file;

        // Calculate aspect ratio
        const img = new Image();
        img.onload = async () => {
            state.aspectRatio = calculateAspectRatio(img.width, img.height);
            console.log(`Image dimensions: ${img.width}x${img.height}, Aspect ratio: ${state.aspectRatio}`);

            // Display original image
            elements.originalImage.src = state.originalImageData;
            elements.uploadSection.style.display = 'none';
            elements.apiKeySection.style.display = 'none';
            elements.originalSection.style.display = 'block';

            // Analyze image
            await analyzeImage();
        };
        img.src = state.originalImageData;
    };
    reader.readAsDataURL(file);
}

// Helper function to calculate aspect ratio
function calculateAspectRatio(width, height) {
    const ratio = width / height;

    // Map to closest supported Imagen aspect ratio
    const ratios = [
        { value: '1:1', ratio: 1.0 },
        { value: '3:4', ratio: 0.75 },
        { value: '4:3', ratio: 1.333 },
        { value: '9:16', ratio: 0.5625 },
        { value: '16:9', ratio: 1.778 }
    ];

    // Find closest match
    let closest = ratios[0];
    let minDiff = Math.abs(ratio - ratios[0].ratio);

    for (const r of ratios) {
        const diff = Math.abs(ratio - r.ratio);
        if (diff < minDiff) {
            minDiff = diff;
            closest = r;
        }
    }

    return closest.value;
}

// API Key management
function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    if (!apiKey) {
        alert('Please enter a valid API key');
        return;
    }

    state.apiKey = apiKey;
    localStorage.setItem('gemini_api_key', apiKey);
    elements.apiKeySection.style.display = 'none';
    alert('API key saved successfully!');
}

// Image analysis
async function analyzeImage() {
    showLoading('Analyzing image with AI...');

    try {
        // Convert image to base64 without data URL prefix
        const base64Data = state.originalImageData.split(',')[1];
        const mimeType = state.originalImage.type;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: "Analyze this image in detail. Describe its style, colors, mood, composition, and key visual elements. Be descriptive and specific."
                            },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to analyze image');
        }

        const data = await response.json();
        state.analysis = data.candidates[0].content.parts[0].text;

        elements.analysisText.textContent = state.analysis;
        hideLoading();

    } catch (error) {
        console.error('Analysis error:', error);
        hideLoading();
        alert(`Failed to analyze image: ${error.message}`);
    }
}

// Generate variations
async function generateVariations() {
    if (!state.analysis) {
        alert('Please wait for image analysis to complete');
        return;
    }

    showLoading('Generating 4 unique variations...');
    elements.originalSection.style.display = 'none';

    // Get toggle states
    const keepColors = elements.keepColorsToggle.checked;
    const keepComposition = elements.keepCompositionToggle.checked;

    // Generate styles based on settings
    let styles = [];

    if (keepColors && keepComposition) {
        // Keep both - only change lighting/mood
        styles = [
            { name: 'Bright & Airy', prompt: 'Keep the exact same composition, subjects, and color palette. Only adjust the lighting to be bright and airy with soft, diffused light.' },
            { name: 'Dramatic Shadows', prompt: 'Keep the exact same composition, subjects, and color palette. Only adjust the lighting to create dramatic shadows and contrast.' },
            { name: 'Soft Glow', prompt: 'Keep the exact same composition, subjects, and color palette. Only add a soft, ethereal glow and gentle lighting.' },
            { name: 'High Contrast', prompt: 'Keep the exact same composition, subjects, and color palette. Only increase the contrast and sharpness.' }
        ];
    } else if (keepColors && !keepComposition) {
        // Keep colors, change composition
        styles = [
            { name: 'Abstract Shapes', prompt: 'Keep the same color palette. Transform the composition into abstract geometric shapes and patterns.' },
            { name: 'Simplified Forms', prompt: 'Keep the same color palette. Simplify the composition into basic shapes and minimalist forms.' },
            { name: 'Flowing Organic', prompt: 'Keep the same color palette. Transform into flowing, organic shapes and curves.' },
            { name: 'Geometric Grid', prompt: 'Keep the same color palette. Reorganize into a geometric grid pattern.' }
        ];
    } else if (!keepColors && keepComposition) {
        // Change colors, keep composition
        styles = [
            { name: 'Warm Sunset Vibes', prompt: 'Keep the exact same composition and structure. Transform the color palette to warm sunset tones: golden yellows, deep oranges, warm reds, and soft pinks. Maintain all subjects and elements in their original positions.' },
            { name: 'Cool Ocean Tones', prompt: 'Keep the exact same composition and structure. Transform the color palette to cool ocean tones: deep blues, turquoise, seafoam greens, and soft aquas. Maintain all subjects and elements in their original positions.' },
            { name: 'Vibrant Neon Energy', prompt: 'Keep the exact same composition and structure. Transform the color palette to vibrant neon colors: electric pinks, bright cyans, vivid purples, and glowing greens. Maintain all subjects and elements in their original positions.' },
            { name: 'Monochrome Elegance', prompt: 'Keep the exact same composition and structure. Transform to a sophisticated monochrome palette with rich blacks, pure whites, and elegant grays. Maintain all subjects and elements in their original positions.' }
        ];
    } else {
        // Change both - full creative freedom
        styles = [
            { name: 'Pop Art Style', prompt: 'Transform into vibrant pop art style with bold colors, high contrast, graphic elements, and dynamic composition.' },
            { name: 'Watercolor Dream', prompt: 'Reimagine in soft watercolor style with pastel colors, gentle blending, flowing composition, and ethereal atmosphere.' },
            { name: 'Cyberpunk Neon', prompt: 'Recreate with cyberpunk aesthetic featuring neon colors, futuristic elements, dynamic angles, and high-tech urban vibe.' },
            { name: 'Minimalist Modern', prompt: 'Reinterpret in minimalist modern style with clean lines, muted colors, simplified shapes, and elegant negative space.' }
        ];
    }

    state.variations = [];

    try {
        // Generate all variations in parallel
        const promises = styles.map(style => generateSingleVariation(style));
        const results = await Promise.all(promises);

        state.variations = results;
        displayVariations();

    } catch (error) {
        console.error('Generation error:', error);
        hideLoading();
        alert(`Failed to generate variations: ${error.message}`);
        elements.originalSection.style.display = 'block';
    }
}

async function generateSingleVariation(style) {
    try {
        // Step 1: Create a detailed image generation prompt based on the analysis
        const promptCreationResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Based on this image analysis: "${state.analysis}"\n\nCreate a detailed, vivid image generation prompt that describes the scene in ${style.name} style. ${style.prompt}\n\nThe prompt should be detailed and descriptive, focusing on visual elements, colors, mood, and artistic style. Keep it under 1000 characters. Do not include any preamble, just output the image generation prompt.`
                        }]
                    }]
                })
            }
        );

        if (!promptCreationResponse.ok) {
            throw new Error('Failed to create image prompt');
        }

        const promptData = await promptCreationResponse.json();
        const imagePrompt = promptData.candidates[0].content.parts[0].text;

        // Step 2: Generate image using Imagen 4.0 API
        const imageResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`,
            {
                method: 'POST',
                headers: {
                    'x-goog-api-key': state.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instances: [{
                        prompt: imagePrompt
                    }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: state.aspectRatio
                    }
                })
            }
        );

        if (!imageResponse.ok) {
            const errorData = await imageResponse.json();
            throw new Error(errorData.error?.message || 'Failed to generate image');
        }

        const imageData = await imageResponse.json();

        // Extract generated image from Imagen response
        let generatedImageData = state.originalImageData;

        if (imageData.predictions && imageData.predictions[0]) {
            const prediction = imageData.predictions[0];

            // Imagen returns base64 image in bytesBase64Encoded or mimeType fields
            if (prediction.bytesBase64Encoded) {
                generatedImageData = `data:image/png;base64,${prediction.bytesBase64Encoded}`;
            } else if (prediction.image && prediction.image.bytesBase64Encoded) {
                generatedImageData = `data:image/png;base64,${prediction.image.bytesBase64Encoded}`;
            }
        }

        return {
            name: style.name,
            description: imagePrompt,
            imageData: generatedImageData
        };

    } catch (error) {
        console.error(`Error generating ${style.name}:`, error);
        return {
            name: style.name,
            description: `Failed to generate: ${error.message}`,
            imageData: state.originalImageData
        };
    }
}

function displayVariations() {
    hideLoading();
    elements.variationsGrid.innerHTML = '';

    state.variations.forEach((variation, index) => {
        const card = document.createElement('div');
        card.className = 'variation-card';

        card.innerHTML = `
            <div class="variation-image-container">
                <img src="${variation.imageData}" alt="${variation.name}" class="variation-image">
                <button class="download-btn" data-index="${index}" title="Download ${variation.name}">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="variation-info">
                <h3 class="variation-title">${variation.name}</h3>
                <p class="variation-description">${variation.description}</p>
            </div>
        `;

        elements.variationsGrid.appendChild(card);
    });

    // Add download event listeners
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            downloadVariation(index);
        });
    });

    // Add Import to AE buttons if running in CEP
    if (window.__adobe_cep__) {
        document.querySelectorAll('.variation-image-container').forEach((container, index) => {
            const importBtn = document.createElement('button');
            importBtn.className = 'import-ae-btn';
            importBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 3V15M12 15L7 10M12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Import to AE</span>
            `;
            importBtn.title = "Import to After Effects";
            importBtn.onclick = (e) => {
                e.stopPropagation();
                importToAE(index);
            };
            container.appendChild(importBtn);
        });
    }

    elements.variationsSection.style.display = 'block';
}

// Import to After Effects (CEP only)
async function importToAE(index) {
    if (!window.__adobe_cep__) return;

    const variation = state.variations[index];
    const csInterface = new CSInterface();

    // Use Node.js to save file locally first
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // Create temp path
    const tempDir = os.tmpdir();
    const fileName = `${variation.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
    const filePath = path.join(tempDir, fileName);

    // Remove data URL prefix to get raw base64
    const base64Data = variation.imageData.replace(/^data:image\/\w+;base64,/, "");

    try {
        // Write file
        fs.writeFileSync(filePath, base64Data, 'base64');

        // Call ExtendScript to import
        // We need to escape backslashes for Windows paths in ExtendScript
        const escapedPath = filePath.replace(/\\/g, "\\\\");

        csInterface.evalScript(`downloadAndImportImage('${escapedPath}', '${variation.name}')`, (result) => {
            const res = JSON.parse(result);
            if (res.status === 'success') {
                alert('Image imported to After Effects!');
            } else {
                alert('Failed to import: ' + res.message);
            }
        });

    } catch (err) {
        console.error('Error saving file for AE import:', err);
        alert('Error saving file: ' + err.message);
    }
}

// Download variation image
function downloadVariation(index) {
    const variation = state.variations[index];
    const link = document.createElement('a');
    link.href = variation.imageData;
    link.download = `${variation.name.replace(/\s+/g, '_').toLowerCase()}_variation.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// UI helpers
function showLoading(message) {
    elements.loadingText.textContent = message;
    elements.loadingSection.style.display = 'block';
}

function hideLoading() {
    elements.loadingSection.style.display = 'none';
}

function resetApp() {
    state.originalImage = null;
    state.originalImageData = null;
    state.analysis = null;
    state.variations = [];

    elements.fileInput.value = '';
    elements.uploadSection.style.display = 'block';
    if (!state.apiKey) {
        elements.apiKeySection.style.display = 'block';
    }
    elements.originalSection.style.display = 'none';
    elements.variationsSection.style.display = 'none';
    elements.variationsGrid.innerHTML = '';
}

// Initialize on load
init();
