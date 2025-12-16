# ElevenLabs Voiceover for After Effects

An Adobe After Effects CEP Extension that integrates ElevenLabs AI Text-to-Speech directly into your workflow. Generate high-quality voiceovers and automatically import them into your active composition.

![ElevenLabs Voiceover](https://img.shields.io/badge/After%20Effects-18.0%2B-blueviolet)

## Features

- **Direct Integration**: Seamlessly runs inside After Effects.
- **Voice Selection**: Fetch and select from your available ElevenLabs voices.
- **Real-time Generation**: Type your script and generate audio on the fly.
- **Auto Import**: Generated audio files are automatically saved and imported into your active composition timeline.
- **Secure Key Storage**: Your API Key is stored locally in your browser/webview local storage.
- **Dark Mode UI**: Designed to match the After Effects interface.

## Installation

### Manual Installation (Development)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ilanlenzner-design/elevenlabs_voiceover.git
    ```

2.  **Move to Extensions Folder:**
    Copy the `elevenlabs_voiceover` folder to your CEP extensions directory:
    -   **Mac:** `/Library/Application Support/Adobe/CEP/extensions/`
    -   **Windows:** `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`

3.  **Enable Debug Mode (Required for unsigned extensions):**
    Open your terminal/command prompt and run:
    -   **Mac:** `defaults write com.adobe.CSXS.18 PlayerDebugMode 1` (Repeat for versions 19, 20, etc.)
    -   **Windows:** Edit registry to set `PlayerDebugMode` to `1`.

4.  **Restart After Effects.**

## Usage

1.  Open After Effects.
2.  Navigate to **Window > Extensions > ElevenLabs Voiceover**.
3.  Click the **Settings (Gear Icon)** in the top right.
4.  Paste your **ElevenLabs API Key** and click Save.
5.  Select a **Voice** from the dropdown menu.
6.  Enter your text script.
7.  Click **Generate Voiceover**.

The audio will be generated and placed into your current composition.

## Technologies Built With

-   **HTML/CSS/JS**: Core frontend technologies.
-   **Adobe CEP**: Common Extensibility Platform for Adobe apps.
-   **Node.js**: Used within CEP for file system access and API requests.
-   **ElevenLabs API**: For high-quality text-to-speech generation.

## License

This project is open source.
