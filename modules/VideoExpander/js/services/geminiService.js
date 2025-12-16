// Gemini API Service
const GeminiService = {
    /**
     * Call Gemini API to generate a creative prompt based on video and style
     * @param {string} videoPath - Path to the video file
     * @param {string} style - User's style/prompt input
     * @returns {Promise<string>} Generated prompt
     */
    async generatePrompt(videoPath, style) {
        const apiKey = Config.getGeminiKey();
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        try {
            // Read video file as base64
            const videoBase64 = await this.readFileAsBase64(videoPath);

            // Get video mime type
            const mimeType = this.getMimeType(videoPath);

            // Prepare request
            const url = `${Config.API.GEMINI_API_URL}?key=${apiKey}`;

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: videoBase64
                            }
                        },
                        {
                            text: `Analyze this video and create a detailed creative prompt for video generation based on this style: "${style}". 
                            
The prompt should describe the key visual elements, motion, atmosphere, and aesthetic that would transform this video into the requested style. Be specific and creative.

Provide only the prompt text without any additional explanation.`
                        }
                    ]
                }]
            };

            // Make API call
            const response = await axios.post(url, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Extract generated text
            if (response.data &&
                response.data.candidates &&
                response.data.candidates[0] &&
                response.data.candidates[0].content &&
                response.data.candidates[0].content.parts &&
                response.data.candidates[0].content.parts[0]) {

                return response.data.candidates[0].content.parts[0].text.trim();
            } else {
                throw new Error('Unexpected response format from Gemini API');
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error(`Failed to generate prompt: ${error.message}`);
        }
    },

    /**
     * Read file as base64 using Node.js fs module (available in CEP)
     * @param {string} filePath - Path to file
     * @returns {Promise<string>} Base64 encoded file content
     */
    readFileAsBase64(filePath) {
        return new Promise((resolve, reject) => {
            const fs = require('fs');
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.toString('base64'));
                }
            });
        });
    },

    /**
     * Get MIME type from file extension
     * @param {string} filePath - Path to file
     * @returns {string} MIME type
     */
    getMimeType(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        const mimeTypes = {
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'webm': 'video/webm',
            'mkv': 'video/x-matroska'
        };
        return mimeTypes[ext] || 'video/mp4';
    }
};
