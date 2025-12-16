// Configuration management
const Config = {
    // Storage keys
    STORAGE_KEYS: {
        GEMINI_API_KEY: 'videoexpander_gemini_key',
        RUNWAY_API_KEY: 'videoexpander_runway_key'
    },

    // API endpoints
    API: {
        GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        RUNWAY_API_URL: 'https://api.dev.runwayml.com/v1'
    },

    // Save API key to localStorage
    saveApiKey(key, value) {
        localStorage.setItem(key, value);
    },

    // Get API key from localStorage
    getApiKey(key) {
        return localStorage.getItem(key) || '';
    },

    // Get Gemini API key
    getGeminiKey() {
        return this.getApiKey(this.STORAGE_KEYS.GEMINI_API_KEY);
    },

    // Get Runway API key
    getRunwayKey() {
        return this.getApiKey(this.STORAGE_KEYS.RUNWAY_API_KEY);
    },

    // Save Gemini API key
    saveGeminiKey(key) {
        this.saveApiKey(this.STORAGE_KEYS.GEMINI_API_KEY, key);
    },

    // Save Runway API key
    saveRunwayKey(key) {
        this.saveApiKey(this.STORAGE_KEYS.RUNWAY_API_KEY, key);
    },

    // Check if all required API keys are set
    hasAllKeys() {
        return this.getGeminiKey() && this.getRunwayKey();
    }
};
