

// IMMEDIATE DEBUG CHECK
// window.alert("Main.js is reading!");

document.addEventListener('DOMContentLoaded', () => {

    try {
        const tools = [
            {
                title: "AI Image Expander",
                description: "Expand image boundaries seamlessly",
                id: "com.ilanlenzner.aiimageexpander.panel",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3zM9 21l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6zM21 15l-2.3 2.3-2.87-2.89-1.42 1.42L17.3 18.7 15 21h6z"/></svg>',
                class: "icon-expander"
            },
            {
                title: "AI Image Upscaler",
                description: "Enhance resolution up to 4x",
                id: "com.ilanlenzner.aiupscaler.panel",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z"/></svg>',
                class: "icon-upscaler"
            },
            {
                title: "AI Background Remover",
                description: "Isolate subjects instantly",
                id: "com.sett.bgremover",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M7 17h10v-3l-2.5-2.5-2.5 2.5-1.5-1.5-3.5 3.5V17zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></svg>',
                class: "icon-remover"
            },
            {
                title: "AI Image Iteration",
                description: "Generate variations quickly",
                id: "com.ilanlenzner.aiImageVariations",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>',
                class: "icon-iteration"
            },
            {
                title: "AI Video Tool",
                description: "Create videos from text prompts",
                id: "com.kling.extension.panel",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>',
                class: "icon-video"
            },
            {
                title: "AI Video Iteration",
                description: "Style transfer for video clips",
                id: "com.videoexpander.panel",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>',
                class: "icon-video"
            },
            {
                title: "AI Sound FX",
                description: "Generate cinematic sound effects",
                id: "com.ilanlenzner.sonicforge.panel",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
                class: "icon-sound"
            },
            {
                title: "AI Music Creation",
                description: "Compose original royalty-free tracks",
                id: "com.sonicforge.extension.panel",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
                class: "icon-music"
            },
            {
                title: "AI Voiceover",
                description: "Generate voiceovers with ElevenLabs",
                id: "com.antigravity.elevenlabs.voiceover.panel",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
                class: "icon-voice"
            },
            {
                title: "Smart Copywriter AI",
                description: "Generate & style ad copy instantly",
                id: "com.antigravity.smartcopy.panel",
                icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"/></svg>',
                class: "icon-copy"
            }
        ];

        const listElement = document.querySelector('.tools-list');
        if (!listElement) {
            console.error("Tools list element not found");
            return;
        }

        // Clear loading state if any
        listElement.innerHTML = '';

        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';

            // Icon
            const iconBox = document.createElement('div');
            iconBox.className = `icon-box ${tool.class}`;
            iconBox.innerHTML = tool.icon;
            card.appendChild(iconBox);

            // Content
            const content = document.createElement('div');
            content.className = 'content';

            const title = document.createElement('div');
            title.className = 'tool-title';
            title.textContent = tool.title;

            if (tool.tag) {
                const tag = document.createElement('span');
                tag.className = `tag ${tool.tagClass}`;
                tag.textContent = tool.tag;
                title.appendChild(tag);
            }

            content.appendChild(title);

            const desc = document.createElement('div');
            desc.className = 'tool-desc';
            desc.textContent = tool.description;
            content.appendChild(desc);

            card.appendChild(content);

            // Arrow
            const arrow = document.createElement('div');
            arrow.className = 'arrow';
            arrow.innerHTML = '&#10095;'; // Right chevron
            card.appendChild(arrow);

            // Click Event
            card.addEventListener('click', () => {
                if (typeof CSInterface !== 'undefined') {
                    const csInterface = new CSInterface();
                    csInterface.requestOpenExtension(tool.id);
                } else {
                    console.warn("CSInterface not found (browser mode?)");
                }
            });

            listElement.appendChild(card);
        });

    } catch (e) {
        alert("Main.js Error: " + e.message);
    }
});
