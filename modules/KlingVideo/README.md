# Kling AI Video Extension for After Effects

This Adobe After Effects extension brings the power of **Kling AI** and **Minimax** directly into your workflow, allowing you to generate high-quality videos from images or text prompts without leaving After Effects.

## Features

*   **Image-to-Video (I2V)**: Bring static images to life using the **Kling v2.1** model.
    *   **Start Frame**: Use any layer in your composition as the starting frame.
    *   **End Frame**: (Optional) Guide the video's conclusion by selecting a target end frame layer (automatically switches to "Pro" mode).
*   **Text-to-Video (T2V)**: Generate stunning videos from scratch using the **Minimax Video-01** model.
*   **Duration Control**: Choose between **5-second** (Standard) and **10-second** (Pro) generations.
*   **Seamless Integration**: Generated videos are automatically downloaded and imported into your active After Effects timeline.
*   **Pro Mode Support**: Automatically handles advanced parameterized requests for "Pro" quality generations.

## Requirements

*   Adobe After Effects 2022 or higher.
*   A **Replicate API Key** (Get one at [replicate.com](https://replicate.com)).

## Installation

1.  Download the repository.
2.  Move the folder to your Adobe CEP extensions directory:
    *   **macOS**: `/Library/Application Support/Adobe/CEP/extensions/`
    *   **Windows**: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
3.  (Optional) If you haven't enabled unsigned extensions, open Terminal (Mac) or Command Prompt (Win) and run:
    *   **Mac**: `defaults write com.adobe.CSXS.11 PlayerDebugMode 1` (Change "11" to your AE version's CSXS version if needed).
    *   **Win**: `reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f`
4.  Restart After Effects.
5.  Open the extension via **Window > Extensions > Kling AI Video**.

## Usage

1.  **Setup**: Click the Gear icon (⚙️) and paste your Replicate API Key.
2.  **Select Mode**:
    *   **Image to Video**: Uses Kling v2.1. Select a layer in your timeline and click **+** next to "Start Frame" (and optionally "End Frame").
    *   **Text to Video**: Uses Minimax Video-01. No image required.
3.  **Configure**:
    *   **Duration**: Select 5s or 10s.
    *   **Prompt**: Describe the motion or scene you want to generate.
    *   **Negative Prompt**: (Optional) Describe what you want to avoid.
4.  **Generate**: Click "Generate Video".
5.  **Import**: Once finished, the video will automatically appear in your timeline.

## Technologies Used

*   Adobe CEP (HTML/CSS/JS)
*   Node.js
*   Replicate API
*   Axios for robust networking

## License

This project is open source. feel free to modify and improve it!
