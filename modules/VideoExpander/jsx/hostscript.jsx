// After Effects ExtendScript functions

/**
 * Get information about the selected layer
 * @returns {string} JSON string with layer info or null
 */
function getSelectedLayer() {
    try {
        var comp = app.project.activeItem;

        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ error: "No active composition" });
        }

        if (comp.selectedLayers.length === 0) {
            return JSON.stringify({ error: "No layer selected" });
        }

        var layer = comp.selectedLayers[0];

        // Check if it's an AV layer with source
        if (!(layer instanceof AVLayer)) {
            return JSON.stringify({ error: "Selected layer is not an AV layer (must be footage, not text/shape/adjustment layer)" });
        }

        if (!layer.source) {
            return JSON.stringify({ error: "Layer has no source" });
        }

        var layerInfo = {
            name: layer.name,
            startTime: layer.startTime,
            duration: layer.source.duration,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
            width: layer.source.width,
            height: layer.source.height
        };

        return JSON.stringify(layerInfo);

    } catch (error) {
        return JSON.stringify({ error: "Exception: " + error.toString() });
    }
}

/**
 * Export the selected layer as a video file
 * @returns {string} Path to exported video file
 */
function exportSelectedLayer() {
    try {
        var comp = app.project.activeItem;

        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }

        if (comp.selectedLayers.length === 0) {
            return "Error: No layer selected";
        }

        var layer = comp.selectedLayers[0];

        if (!(layer instanceof AVLayer) || !layer.source) {
            return "Error: Selected layer is not an AV layer";
        }

        // Check if source is a footage item
        if (!(layer.source instanceof FootageItem)) {
            return "Error: Layer source is not a footage item";
        }

        var footage = layer.source;

        // If the footage has a file, return it directly
        if (footage.file) {
            return footage.file.fsName;
        }

        // If it's a solid or generated, we need to render it
        // For now, return error - we can enhance this later
        return "Error: Layer source doesn't have a file. Please use a video file layer.";

    } catch (error) {
        return "Error: " + error.toString();
    }
}

/**
 * Import video file and add it to the active composition
 * @param {string} videoPath - Path to video file
 * @returns {string} "success" or error message
 */
function importAndAddVideo(videoPath) {
    try {
        var comp = app.project.activeItem;

        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }

        // Import the video file
        var importOptions = new ImportOptions(new File(videoPath));

        if (!importOptions.file.exists) {
            return "Error: Video file does not exist: " + videoPath;
        }

        var footage = app.project.importFile(importOptions);

        if (!footage) {
            return "Error: Failed to import video file";
        }

        // Add to composition
        var newLayer = comp.layers.add(footage);

        // Position at the top of the layer stack
        newLayer.moveToBeginning();

        // Select the new layer
        for (var i = 1; i <= comp.selectedLayers.length; i++) {
            comp.selectedLayers[i - 1].selected = false;
        }
        newLayer.selected = true;

        return "success";

    } catch (error) {
        return "Error: " + error.toString();
    }
}
