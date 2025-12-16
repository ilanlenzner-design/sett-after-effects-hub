// Node imports - these work because we enabled Node.js in manifest
const fs = require('fs');
const path = require('path');
const https = require('https');

class ElevenLabsService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    async getVoices() {
        if (!this.apiKey) throw new Error("API Key is missing");

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.elevenlabs.io',
                path: '/v1/voices',
                method: 'GET',
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const parsed = JSON.parse(data);
                            resolve(parsed.voices);
                        } catch (e) {
                            reject(new Error("Failed to parse voices response"));
                        }
                    } else {
                        reject(new Error(`API Error: ${res.statusCode} ${data}`));
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.end();
        });
    }

    async generateAudio(text, voiceId, modelId = 'eleven_multilingual_v2') {
        if (!this.apiKey) throw new Error("API Key is missing");

        const requestBody = JSON.stringify({
            text: text,
            model_id: modelId,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.elevenlabs.io',
                path: `/v1/text-to-speech/${voiceId}`,
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                }
            };

            const req = https.request(options, (res) => {
                if (res.statusCode !== 200) {
                    let errorData = '';
                    res.on('data', chunk => errorData += chunk);
                    res.on('end', () => reject(new Error(`Translation Failed: ${errorData}`)));
                    return;
                }

                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });
            });

            req.on('error', (e) => reject(e));
            req.write(requestBody);
            req.end();
        });
    }

    async saveAudioFile(buffer, fileName) {
        // We need csInterface to get paths, but we can't depend on it being globally instantiated yet.
        // We'll trust the caller to handle paths or create a temporary instance just for paths.
        // Alternatively, use standard Node paths if possible, but SystemPath.MY_DOCUMENTS is safer cross-platform.

        // Let's rely on standard OS paths via node 'os' module if we want to be independent,
        // but since we have CSInterface, let's assume it's available or grab it.
        // For simplicity in this service, I'll use os.homedir() from Node.

        const os = require('os');
        const homeDir = os.homedir();
        // Mac: /Users/username, Win: C:\Users\username

        const saveDir = path.join(homeDir, 'Documents', 'ElevenLabs_Voiceovers');

        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        const filePath = path.join(saveDir, fileName);

        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, buffer, (err) => {
                if (err) reject(err);
                else resolve(filePath);
            });
        });
    }
}

// Attach to window for browser context
window.ElevenLabsService = ElevenLabsService;
