function getSelectedTextLayerContent() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        return JSON.stringify({ error: "No active composition." });
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        return JSON.stringify({ error: "No layer selected." });
    }

    var layer = selectedLayers[0];
    if (!(layer instanceof TextLayer)) {
        return JSON.stringify({ error: "Selected layer is not a text layer." });
    }

    var textProp = layer.property("Source Text");
    var textDocument = textProp.value;
    var textContent = textDocument.text;

    return JSON.stringify({
        text: textContent,
        layerName: layer.name
    });
}

function replaceSelectedTextLayerContent(newText) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ error: "No active composition." });
        }

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            return JSON.stringify({ error: "No layer selected." });
        }

        var layer = selectedLayers[0];
        if (!(layer instanceof TextLayer)) {
            return JSON.stringify({ error: "Selected layer is not a text layer." });
        }

        // undo group
        app.beginUndoGroup("Replace Text with Smart Copy");

        var textProp = layer.property("Source Text");
        var textDocument = textProp.value;
        textDocument.text = newText;
        textProp.setValue(textDocument);

        app.endUndoGroup();

        return JSON.stringify({ success: true });
    } catch (e) {
        return JSON.stringify({ error: "Error replacing text: " + e.toString() });
    }
}

function addSmartBackground() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return JSON.stringify({ error: "No active composition." });

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) return JSON.stringify({ error: "Select a text layer first." });

        var textLayer = selectedLayers[0];
        if (!(textLayer instanceof TextLayer)) return JSON.stringify({ error: "Selected layer must be text." });

        app.beginUndoGroup("Add Smart Background");

        // 1. Create Layout FIRST
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = textLayer.name + "_BG";

        // 2. Parent and Place references
        shapeLayer.parent = textLayer;
        shapeLayer.moveToEnd();
        shapeLayer.moveAfter(textLayer);

        // 3. Reset Transforms
        shapeLayer.transform.position.setValue([0, 0]);
        shapeLayer.transform.scale.setValue([100, 100]);
        shapeLayer.transform.anchorPoint.setValue([0, 0]);

        // 4. Create Group
        var shapeGroup = shapeLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var groupContents = shapeGroup.property("ADBE Vectors Group");

        // 5. Add Rectangle & Set Expressions IMMEDIATELY (Before adding Fill)
        var rect = groupContents.addProperty("ADBE Vector Shape - Rect");
        var rectSize = rect.property("ADBE Vector Rect Size");
        var rectPos = rect.property("ADBE Vector Rect Position");

        var padding = 40;

        var sizeExpr =
            "try { " +
            "var s = thisComp.layer('" + textLayer.name + "'); " +
            "var w = s.sourceRectAtTime(time).width; " +
            "var h = s.sourceRectAtTime(time).height; " +
            "[w + " + padding + ", h + " + padding + "]; " +
            "} catch(e) { [100,100]; }";

        rectSize.expression = sizeExpr;

        var posExpr =
            "try { " +
            "var s = thisLayer.parent; " +
            "var r = s.sourceRectAtTime(time, false); " +
            "[r.left + r.width/2, r.top + r.height/2]; " +
            "} catch(e) { [0,0]; }";

        rectPos.expression = posExpr;

        // 6. Add Fill LAST (Adding property here invalidates previous sibling references like 'rect')
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        var fillColor = fill.property("ADBE Vector Fill Color");
        fillColor.setValue([0.1, 0.1, 0.1]);

        app.endUndoGroup();
        return JSON.stringify({ success: true });

    } catch (e) {
        return JSON.stringify({ error: "Script Error at line " + (e.line || '?') + ": " + e.message });
    }
}

function applyAnimationPreset(type) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return JSON.stringify({ error: "No active comp." });

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) return JSON.stringify({ error: "Select a layer." });
        var layer = selectedLayers[0];

        app.beginUndoGroup("Apply Animation: " + type);

        // Common vars
        var t = comp.time;

        if (type === "pop") {
            // Elastic Scale Up
            var scaleProp = layer.transform.scale;
            scaleProp.setValueAtTime(t, [0, 0]);
            scaleProp.setValueAtTime(t + 0.5, [100, 100]);

            var expr =
                "freq = 3; decay = 5;\r" +
                "n = 0; if (numKeys > 0){ n = nearestKey(time).index; if (key(n).time > time) n--; }\r" +
                "if (n > 0){ t = time - key(n).time; amp = velocityAtTime(key(n).time - .001); w = freq*Math.PI*2; " +
                "value + amp*(Math.sin(t*w)/Math.exp(decay*t)/w); }else{ value; }";

            scaleProp.expression = expr;

        } else if (type === "typewriter") {
            // Text Animator: Opacity
            if (!(layer instanceof TextLayer)) return JSON.stringify({ error: "Typewriter requires a text layer." });

            var animator = layer.Text.Animators.addProperty("ADBE Text Animator");
            animator.name = "Typewriter";

            // Add Opacity Property
            var opacityProp = animator.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
            opacityProp.setValue(0);

            // Safely Get Range Selector
            var selectorsGroup = animator.property("ADBE Text Selectors");
            var selector;
            if (selectorsGroup.numProperties > 0) {
                selector = selectorsGroup.property(1); // Use existing default
            } else {
                selector = selectorsGroup.addProperty("ADBE Text Selector"); // Create if missing
            }

            var startProp = selector.property("ADBE Text Percent Start");
            startProp.setValueAtTime(t, 0);
            startProp.setValueAtTime(t + 1.5, 100);

        } else if (type === "slam") {
            // Hard Slam: Scale + Opacity
            var scale = layer.transform.scale;
            var opacity = layer.transform.opacity;

            scale.setValueAtTime(t, [400, 400]);
            scale.setValueAtTime(t + 0.1, [100, 100]);

            opacity.setValueAtTime(t, 0);
            opacity.setValueAtTime(t + 0.05, 100);

            // Add slight bounce expression to soften the impact
            // Simple hard slam is often better without the wobble if it's meant to be aggressive.
            // Let's stick to just the keyframes for "Impact".

        } else if (type === "glitch") {
            if (!(layer instanceof TextLayer)) return JSON.stringify({ error: "Glitch requires a text layer." });

            var animator = layer.Text.Animators.addProperty("ADBE Text Animator");
            animator.name = "Glitch";

            // Character Offset
            var charOffset = animator.property("ADBE Text Animator Properties").addProperty("ADBE Text Character Offset");
            charOffset.setValue(10);

            // Clean Selectors (Remove default range if it exists, we want to start fresh or modify it)
            var selectorsGroup = animator.property("ADBE Text Selectors");
            while (selectorsGroup.numProperties > 0) {
                selectorsGroup.property(1).remove();
            }

            // Add Range Selector manually to ensure we have a clean state
            var range = selectorsGroup.addProperty("ADBE Text Selector");

            // Animate Character Offset
            charOffset.setValueAtTime(t, 30);
            charOffset.setValueAtTime(t + 0.4, 0);

            // Randomize Order
            range.property("ADBE Text Range Advanced").property("ADBE Text Randomize Order").setValue(1);

            // Optional: Animate opacity to flicker in? 
            // For now, just the character scrambling is the core effect.
        }

        app.endUndoGroup();
        return JSON.stringify({ success: true });

    } catch (e) {
        return JSON.stringify({ error: "Anim Error: " + e.toString() });
    }
}

function createVisualVariants() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return JSON.stringify({ error: "No active comp." });

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) return JSON.stringify({ error: "Select a text layer." });
        var originalLayer = selectedLayers[0];
        if (!(originalLayer instanceof TextLayer)) return JSON.stringify({ error: "Selected layer must be text." });

        app.beginUndoGroup("Create Typography Variants");

        var presets = [
            {
                suffix: "_HYPE",
                fillColor: [1, 1, 0], // Bright Yellow
                strokeColor: [0, 0, 0], // Black
                strokeWidth: 5,
                tracking: 0,
                fill: true,
                stroke: true
            },
            {
                suffix: "_CINEMATIC",
                fillColor: [1, 1, 1], // White
                strokeColor: [0, 0, 0],
                strokeWidth: 0,
                tracking: 300, // Wide spacing
                fill: true,
                stroke: false
            },
            {
                suffix: "_DANGER",
                fillColor: [1, 0.1, 0.1], // Red
                strokeColor: [1, 1, 1], // White
                strokeWidth: 3,
                tracking: 50,
                fill: true,
                stroke: true
            }
        ];

        // Hide original
        originalLayer.enabled = false;
        originalLayer.label = 0; // None

        // Create Variants in reverse order so they stack nicely above original
        for (var i = presets.length - 1; i >= 0; i--) {
            var style = presets[i];
            var newLayer = originalLayer.duplicate();
            newLayer.name = originalLayer.name + style.suffix;
            newLayer.enabled = (i === 0); // Only enable the first one (Visual Spinner logic)
            newLayer.label = 10; // Purple for "Variant"

            var textProp = newLayer.property("Source Text");
            var textDoc = textProp.value;

            // Apply Style
            if (style.fill) {
                textDoc.fillColor = style.fillColor;
                textDoc.applyFill = true;
            }
            if (style.stroke) {
                textDoc.strokeColor = style.strokeColor;
                textDoc.strokeWidth = style.strokeWidth;
                textDoc.applyStroke = true;
            } else {
                textDoc.applyStroke = false;
            }

            textDoc.tracking = style.tracking;

            textProp.setValue(textDoc);

            // Move above original
            newLayer.moveBefore(originalLayer);
        }

        app.endUndoGroup();
        return JSON.stringify({ success: true });

    } catch (e) {
        return JSON.stringify({ error: "Variant Error: " + e.toString() });
    }
}

function applySentimentStyle(styleDataStr) {
    try {
        var styleData = JSON.parse(styleDataStr);
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return JSON.stringify({ error: "No active comp." });

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) return JSON.stringify({ error: "Select a text layer." });
        var layer = selectedLayers[0];
        if (!(layer instanceof TextLayer)) return JSON.stringify({ error: "Selected layer must be text." });

        app.beginUndoGroup("Apply AI Sentiment Style");

        var textProp = layer.property("Source Text");
        var textDoc = textProp.value;

        // Apply Color
        if (styleData.fillColor) {
            textDoc.fillColor = styleData.fillColor;
            textDoc.applyFill = true;
        }

        // Apply Stroke
        if (styleData.strokeColor) {
            textDoc.strokeColor = styleData.strokeColor;
            textDoc.strokeWidth = styleData.strokeWidth || 0;
            textDoc.applyStroke = true;
        } else {
            textDoc.applyStroke = false;
        }

        // Apply Tracking/Spacing
        if (styleData.tracking !== undefined) {
            textDoc.tracking = styleData.tracking;
        }

        // Update Text
        textProp.setValue(textDoc);

        // Apply Animation if requested (and not conflicting)
        // We can reuse our existing animation function logic!
        // But for now, let's just stick to the static style to avoid overwriting existing animations too aggressively.

    } catch (e) {
        return JSON.stringify({ error: "Style Error: " + e.toString() });
    }
}

function applyPowerHighlight(wordsDataStr) {
    try {
        var wordsToHighlight = JSON.parse(wordsDataStr);
        // Validation: Ensure valid array
        if (!wordsToHighlight || typeof wordsToHighlight.length === 'undefined') {
            return JSON.stringify({ error: "Invalid words data (not an array)" });
        }

        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return JSON.stringify({ error: "No active comp." });

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) return JSON.stringify({ error: "Select a text layer." });
        var layer = selectedLayers[0];
        if (!(layer instanceof TextLayer)) return JSON.stringify({ error: "Need text layer." });

        app.beginUndoGroup("Apply Power Highlight");

        // 1. Get Text Properties Group (Safe Access)
        var textGroup = layer.property("ADBE Text Properties");
        if (!textGroup) return JSON.stringify({ error: "Could not find Text Properties" });

        var animatorsGroup = textGroup.property("ADBE Text Animators");
        if (!animatorsGroup) return JSON.stringify({ error: "Could not find Animators Group" });

        // 2. Add New Animator
        var animator = animatorsGroup.addProperty("ADBE Text Animator");
        animator.name = "Power Highlights";

        // 3. Style Properties (Gold Emphasis)
        var props = animator.property("ADBE Text Animator Properties");

        var fill = props.addProperty("ADBE Text Fill Color");
        if (fill) fill.setValue([1, 0.85, 0]); // Gold Yellow

        var strokeWidth = props.addProperty("ADBE Text Stroke Width");
        if (strokeWidth) strokeWidth.setValue(2);

        var strokeColor = props.addProperty("ADBE Text Stroke Color");
        if (strokeColor) strokeColor.setValue([0, 0, 0]); // Black outline

        // Scale: Try 3D first (standard for Animators), then 2D
        var addedScale = false;
        try {
            var scale3d = props.addProperty("ADBE Text Scale 3D");
            if (scale3d) {
                scale3d.setValue([110, 110, 100]);
                addedScale = true;
            }
        } catch (e) { }

        if (!addedScale) {
            try {
                var scale2d = props.addProperty("ADBE Text Scale");
                if (scale2d) scale2d.setValue([110, 110]);
            } catch (e) { }
        }

        // Remove default range selector if exists
        var selectors = animator.property("ADBE Text Selectors");
        if (selectors && selectors.numProperties > 0) {
            selectors.property(1).remove();
        }

        // 4. Find and Select Words
        var textDocProp = textGroup.property("ADBE Text Document");
        if (!textDocProp) textDocProp = layer.property("Source Text"); // Fallback

        var sourceText = "";
        try {
            sourceText = textDocProp.value.text;
        } catch (e) {
            sourceText = textDocProp.value.toString();
        }

        var count = 0;
        for (var i = 0; i < wordsToHighlight.length; i++) {
            var word = wordsToHighlight[i];
            if (!word) continue;

            // basic search
            var idx = sourceText.indexOf(word);
            var searchIdx = 0;
            var safety = 0;

            while (searchIdx !== -1 && safety < 100) {
                searchIdx = sourceText.indexOf(word, searchIdx);
                if (searchIdx !== -1) {
                    // Create Selector
                    var selector = selectors.addProperty("ADBE Text Selector");
                    if (selector) {
                        selector.name = "Sel_" + word;

                        var rangeModeSet = false;
                        var advanced = selector.property("ADBE Text Range Advanced");
                        if (advanced) {
                            // Try standard matchname
                            var unitsProp = advanced.property("ADBE Text Unit Mode");
                            if (unitsProp) {
                                unitsProp.setValue(2); // 2 = Index
                                rangeModeSet = true;
                            }
                        }

                        if (rangeModeSet) {
                            // Use Index
                            selector.property("ADBE Text Percent Start").setValue(searchIdx);
                            selector.property("ADBE Text Percent End").setValue(searchIdx + word.length);
                        } else {
                            // Fallback to Percentage if Units prop blocked
                            var totalLen = sourceText.length;
                            if (totalLen > 0) {
                                var startPct = (searchIdx / totalLen) * 100;
                                var endPct = ((searchIdx + word.length) / totalLen) * 100;
                                selector.property("ADBE Text Percent Start").setValue(startPct);
                                selector.property("ADBE Text Percent End").setValue(endPct);
                            }
                        }

                        count++;
                    }
                    searchIdx += word.length;
                    safety++;
                }
            }
        }

        app.endUndoGroup();
        return JSON.stringify({ success: true, count: count });

    } catch (e) {
        return JSON.stringify({ error: "Highlight Error: " + e.toString() + " (Line: " + e.line + ")" });
    }
}

function applySmartWrap(newText) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return JSON.stringify({ error: "No active comp." });

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) return JSON.stringify({ error: "Select a text layer." });

        var layer = selectedLayers[0];
        if (!(layer instanceof TextLayer)) return JSON.stringify({ error: "Need text layer." });

        app.beginUndoGroup("Smart Wrap Text");

        var textProp = layer.property("Source Text");
        var textDoc = textProp.value;
        textDoc.text = newText;

        // Force Center Justification for nice stacking
        textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;

        textProp.setValue(textDoc);

        // Optional: We could try to recenter the Anchor Point here, but let's leave it simple.

        app.endUndoGroup();
        return JSON.stringify({ success: true });

    } catch (e) {
        return JSON.stringify({ error: "Wrap Error: " + e.toString() });
    }
}
