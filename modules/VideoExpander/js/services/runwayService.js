// Runway API Service
const RunwayService = {
    /**
     * Generate video using Runway API
     * @param {string} videoPath - Path to the input video file
     * @param {string} prompt - Generated prompt from Gemini
     * @param {Function} onStatusUpdate - Callback for status updates
     * @returns {Promise<string>} Path to downloaded video
     */
    /**
     * Generate video using Runway API
     * @param {string} videoPath - Path to the input video file
     * @param {string} prompt - Generated prompt from Gemini
     * @param {string} ratio - Video aspect ratio
     * @param {Function} onStatusUpdate - Callback for status updates
     * @returns {Promise<string>} Path to downloaded video
     */
    async generateVideo(videoPath, prompt, ratio, onStatusUpdate) {
        const apiKey = Config.getRunwayKey();
        if (!apiKey) {
            throw new Error('Runway API key not configured');
        }

        try {
            // Step 1: Create the task
            onStatusUpdate('Uploading video to Runway...', 'info');
            const taskId = await this.createTask(apiKey, videoPath, prompt, ratio);

            onStatusUpdate(`Task created: ${taskId}`, 'success');
            onStatusUpdate('Generating video (this may take a few minutes)...', 'info');

            // Step 2: Poll for completion
            const videoUrl = await this.pollTaskStatus(apiKey, taskId, onStatusUpdate);

            onStatusUpdate('Video generated successfully!', 'success');
            onStatusUpdate('Downloading video...', 'info');

            // Step 3: Download the video
            const localPath = await this.downloadVideo(videoUrl);

            onStatusUpdate('Video downloaded!', 'success');

            return localPath;
        } catch (error) {
            console.error('Runway API error:', error);
            throw error;
        }
    },

    /**
     * Create a video generation task
     * @param {string} apiKey - Runway API key
     * @param {string} videoPath - Path to input video
     * @param {string} prompt - Generation prompt
     * @param {string} ratio - Video aspect ratio (e.g. "1280:768")
     * @returns {Promise<string>} Task ID
     */
    async createTask(apiKey, videoPath, prompt, ratio = '1280:768') {
        try {
            // Normalize ratio to supported standards
            const normalizedRatio = this.normalizeRatio(ratio);
            console.log(`Ratio: ${ratio} -> Normalized: ${normalizedRatio}`);

            // Step 1: Upload the video file
            console.log('Step 1: Uploading asset...');
            const runwayUri = await this.uploadAsset(apiKey, videoPath);
            console.log('Video uploaded successfully, runwayUri:', runwayUri);

            // Step 2: Create generation task
            console.log('Step 2: Creating generation task...');
            const url = `${Config.API.RUNWAY_API_URL}/video_to_video`;

            // Truncate prompt to 1000 characters (Runway limit)
            const truncatedPrompt = prompt.length > 1000 ? prompt.substring(0, 997) + '...' : prompt;
            if (prompt.length > 1000) {
                console.log(`Prompt truncated from ${prompt.length} to ${truncatedPrompt.length} characters`);
            }

            const requestBody = {
                model: 'gen4_aleph',
                videoUri: runwayUri,
                promptText: truncatedPrompt,
                ratio: normalizedRatio,
                seed: Math.floor(Math.random() * 1000000),
                contentModeration: { publicFigureThreshold: 'auto' }
            };

            const response = await axios.post(url, requestBody, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Runway-Version': '2024-11-06',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.id) {
                return response.data.id;
            } else {
                throw new Error('Failed to create Runway task');
            }
        } catch (error) {
            console.error('Create task error details:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                throw new Error(`Runway API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    },

    /**
     * Normalize aspect ratio to supported Runway values
     * Valid values: "1280:720" | "720:1280" | "1104:832" | "960:960" | "832:1104" | "1584:672" | "848:480" | "640:480"
     */
    normalizeRatio(ratioInput) {
        try {
            const parts = ratioInput.split(':');
            const width = parseInt(parts[0]);
            const height = parseInt(parts[1]);

            if (width > height) {
                return '1280:720'; // Standard Landscape (16:9)
            } else if (width < height) {
                return '720:1280'; // Standard Portrait (9:16)
            } else {
                return '960:960'; // Square (1:1)
            }
        } catch (e) {
            return '1280:720'; // Default to landscape
        }
    },

    /**
     * Upload asset to Runway
     * @param {string} apiKey - Runway API key
     * @param {string} videoPath - Path to video file
     * @returns {Promise<string>} Runway URI
     */
    async uploadAsset(apiKey, videoPath) {
        const fs = require('fs');
        const path = require('path');

        // 1. Initiate upload
        const filename = path.basename(videoPath);
        const initUrl = `${Config.API.RUNWAY_API_URL}/uploads`;

        console.log('Initiating upload for:', filename);

        try {
            const initResponse = await axios.post(initUrl, {
                filename: filename,
                type: 'ephemeral'
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Runway-Version': '2024-11-06',
                    'Content-Type': 'application/json'
                }
            });

            const { uploadUrl, fields, runwayUri } = initResponse.data;
            console.log('Upload initiated. URL:', uploadUrl);

            // 2. Upload file to S3
            const videoData = fs.readFileSync(videoPath);
            const blob = new Blob([videoData], { type: 'video/mp4' });

            const formData = new FormData();

            // Append all fields first (required by S3)
            for (const key in fields) {
                formData.append(key, fields[key]);
            }

            // Append file last
            formData.append('file', blob, filename);

            console.log('Uploading to S3...');
            await axios.post(uploadUrl, formData, {
                headers: {
                    // Do NOT set Authorization header for S3 upload
                    // Content-Type is set automatically by FormData
                }
            });

            return runwayUri;
        } catch (error) {
            console.error('Upload failed:', error);
            if (error.response) {
                console.error('Upload error response:', error.response.data);
            }
            throw new Error('Failed to upload video to Runway');
        }
    },

    /**
     * Poll task status until completion
     * @param {string} apiKey - Runway API key
     * @param {string} taskId - Task ID
     * @param {Function} onStatusUpdate - Status update callback
     * @returns {Promise<string>} Video URL
     */
    async pollTaskStatus(apiKey, taskId, onStatusUpdate) {
        const maxAttempts = 120; // 10 minutes max (5s interval)
        let attempts = 0;

        while (attempts < maxAttempts) {
            await this.sleep(5000); // Wait 5 seconds between checks

            const url = `${Config.API.RUNWAY_API_URL}/tasks/${taskId}`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Runway-Version': '2024-11-06'
                }
            });

            const task = response.data;

            if (task.status === 'SUCCEEDED') {
                if (task.output && task.output[0]) {
                    return task.output[0];
                } else {
                    throw new Error('Task succeeded but no video URL returned');
                }
            } else if (task.status === 'FAILED') {
                throw new Error(`Runway task failed: ${task.failure_message || 'Unknown error'}`);
            } else if (task.status === 'CANCELLED') {
                throw new Error('Runway task was cancelled');
            } else {
                // Still processing
                const progress = task.progress || 0;
                onStatusUpdate(`Processing... ${Math.round(progress * 100)}%`, 'info');
            }

            attempts++;
        }

        throw new Error('Video generation timed out');
    },

    /**
     * Download video from URL
     * @param {string} url - Video URL
     * @returns {Promise<string>} Local file path
     */
    async downloadVideo(url) {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        // Create temp file path
        const tempDir = os.tmpdir();
        const fileName = `runway_${Date.now()}.mp4`;
        const filePath = path.join(tempDir, fileName);

        // Download video
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        // Save to file
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, Buffer.from(response.data), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(filePath);
                }
            });
        });
    },

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
