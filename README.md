# Sett Hub - AI Tools for After Effects

**Sett Hub** is a centralized Adobe After Effects Extension (CEP) that provides a unified interface for a suite of powerful AI-driven creative tools. It serves as a launcher and management dashboard for various AI workflows, streamlining the creative process directly within After Effects.

## 🚀 Features & Modules

Sett Hub integrates the following tools into a single, cohesive panel:

*   **AI Image Expander**: Seamlessly expand image boundaries using generative AI.
*   **AI Image Upscaler**: Enhance image resolution up to 4x with high fidelity.
*   **AI Background Remover**: Instantly isolate subjects and remove backgrounds.
*   **AI Image Iteration**: Generate rapid variations of your assets to explore creative directions.
*   **AI Video Tool (Kling)**: Create videos from text prompts using the Kling AI model.
*   **AI Video Iteration**: Apply style transfer and transformative effects to video clips.
*   **AI Sound FX (Sonic Forge)**: Generate cinematic sound effects on demand.
*   **AI Music Creation (Sonic Forge)**: Compose original, royalty-free music tracks.
*   **AI Voiceover (ElevenLabs)**: Generate professional voiceovers using ElevenLabs integration.
*   **Smart Text Copywriter**: Generate & style ad copy instantly using AI (powered by Google Gemini).

## 🛠️ Installation

1.  **Download**: Clone this repository or download the latest release.
2.  **Deploy**: Move the entire `sett-hub` folder to your CEP extensions directory:
    *   **Mac**: `/Library/Application Support/Adobe/CEP/extensions/`
    *   **Windows**: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
3.  **Enable Debug Mode**: If you are installing an unsigned extension, ensure your player debug mode is enabled.
    *   **Mac**: `defaults write com.adobe.CSXS.11 PlayerDebugMode 1` (Adjust version number `11` as needed for your AE version).
    *   **Windows**: Edit the registry key `PlayerDebugMode` to `1`.
4.  **Restart After Effects**: The extension will appear under `Window > Extensions > Sett Iteration Tools`.

## 🖥️ Usage

1.  Open After Effects.
2.  Navigate to `Window > Extensions > Sett Iteration Tools`.
3.  The Hub will open, displaying the list of available tools.
4.  Click on any tool card to launch that specific module.

## 📂 Project Structure

*   `CSXS/`: Manifest file defining the extension and its sub-panels.
*   `css/`: Styles for the main hub interface.
*   `js/`: Core logic for the hub (tool list, CEP interaction).
*   `modules/`: Contains the source code for each individual AI tool.
    *   `SonicForgeMusic/`
    *   `SonicForgeFX/`
    *   `KlingVideo/`
    *   `ElevenLabsVoice/`
    *   `...and others`

## 📝 License

Proprietary / Custom License (As per Ilan Lenzner Design).
