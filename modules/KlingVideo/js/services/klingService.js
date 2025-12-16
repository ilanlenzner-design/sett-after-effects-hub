const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const axios = require('axios');

class KlingService {
    constructor() {
        this.replicate = null;
    }

    init(apiKey) {
        this.replicate = new Replicate({
            auth: apiKey,
        });
    }

    async generateVideo(imagePath, prompt, negativePrompt, duration = 5, callback, endImagePath = null) {
        if (!this.replicate) {
            throw new Error('Replicate service not initialized with API key');
        }

        try {
            let modelId = "kwaivgi/kling-v2.1";
            let input = {
                prompt: prompt
            };

            if (imagePath) {
                // Image-to-Video Configuration (Kling v2.1)
                callback('Reading start frame...');
                const startBuffer = fs.readFileSync(imagePath);
                const mimeType = 'image/png';
                input.start_image = `data:${mimeType};base64,${startBuffer.toString('base64')}`;

                input.duration = duration;
                if (negativePrompt) input.negative_prompt = negativePrompt;

                // Handle End Frame
                if (endImagePath) {
                    callback('Reading end frame...');
                    const endBuffer = fs.readFileSync(endImagePath);
                    input.end_image = `data:${mimeType};base64,${endBuffer.toString('base64')}`;

                    // Kling requires 'pro' mode if end_image is provided
                    input.mode = 'pro';
                    callback('Switching to PRO mode for End Frame support...');
                } else {
                    // Explicitly set standard if not specified, though default is usually standard
                    // input.mode = 'std'; 
                }

                callback(`Starting I2V generation (${duration}s) with Kling v2.1...`);
            } else {
                // Text-to-Video Configuration (Minimax Video-01)
                modelId = "minimax/video-01";
                input = {
                    prompt: prompt,
                    prompt_optimizer: true
                };
                callback(`Starting T2V generation with Minimax Video-01...`);
            }

            const output = await this.replicate.run(
                modelId,
                {
                    input: input
                }
            );

            // Output is usually the video URL (or list of URLs)
            callback('Generation complete. Output received.');

            // Detailed Logging
            console.log('Kling output raw:', JSON.stringify(output, null, 2));

            // Recursive function to find the HTTP URL
            function findHttpUrl(obj) {
                if (!obj) return null;

                if (typeof obj === 'string') {
                    if (obj.startsWith('http')) return obj;
                    return null;
                }

                if (Array.isArray(obj)) {
                    for (let item of obj) {
                        const result = findHttpUrl(item);
                        if (result) return result;
                    }
                }

                if (typeof obj === 'object') {
                    // Check common properties
                    if (obj.url) {
                        const res = findHttpUrl(obj.url);
                        if (res) return res;
                    }
                    if (obj.href) {
                        const res = findHttpUrl(obj.href);
                        if (res) return res;
                    }

                    // If it's a Replicate FileOutput, it might have a toString that works
                    // BUT avoid the trap where toString is a function definition
                    if (obj.toString !== Object.prototype.toString) {
                        const str = obj.toString();
                        if (str.startsWith('http')) return str;
                    }
                }

                return null;
            }

            const videoUrl = findHttpUrl(output);

            if (!videoUrl) {
                console.error('Failed to parse URL from output:', output);
                throw new Error('Could not find a valid http video URL in the Kling output.');
            }

            return videoUrl;

        } catch (error) {
            console.error('Kling generation error:', error);
            throw error;
        }
    }

    async downloadVideo(url, callback) {
        const urlString = String(url);
        callback(`Downloading video from: ${urlString.substring(0, 50)}...`);
        console.log('Downloading from URL:', urlString);

        const tempDir = os.tmpdir();
        const fileName = `kling_${Date.now()}.mp4`;
        const filePath = path.join(tempDir, fileName);

        try {
            // Use arraybuffer instead of stream to avoid adapter issues in CEP
            const response = await axios({
                method: 'GET',
                url: urlString,
                responseType: 'arraybuffer'
            });

            // Write buffer to file
            fs.writeFileSync(filePath, Buffer.from(response.data));

            return filePath;
        } catch (err) {
            console.error('Download error:', err);
            throw new Error(`Download failed: ${err.message}`);
        }
    }
}

module.exports = new KlingService();
