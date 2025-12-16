// Host script for After Effects integration
// This file contains ExtendScript functions callable from the CEP panel

// JSON polyfill for ExtendScript (which doesn't have JSON object by default)
if (typeof JSON === 'undefined') {
    JSON = {
        stringify: function (obj) {
            var t = typeof obj;
            if (t != "object" || obj === null) {
                if (t == "string") return '"' + obj + '"';
                return String(obj);
            } else {
                var n, v, json = [], arr = (obj && obj.constructor == Array);
                for (n in obj) {
                    v = obj[n];
                    t = typeof v;
                    if (t == "string") v = '"' + v + '"';
                    else if (t == "object" && v !== null) v = JSON.stringify(v);
                    json.push((arr ? "" : '"' + n + '":') + String(v));
                }
                return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
            }
        }
    };
}

/**
 * Import an image file into the current After Effects composition
 * @param {string} imagePath - Absolute path to the image file
 * @return {string} Result message
 */
function importImageToComp(imagePath) {
    try {
        app.beginUndoGroup("Import AI Expanded Image");

        // Import the image file first
        var importOptions = new ImportOptions(File(imagePath));
        if (!importOptions.file.exists) {
            return JSON.stringify({
                success: false,
                error: "Image file not found: " + imagePath
            });
        }

        var importedFile = app.project.importFile(importOptions);

        // Get active composition, or create a new one if none exists
        var comp = app.project.activeItem;
        var createdNew = false;
        
        if (!comp || !(comp instanceof CompItem)) {
            // No active composition - create a new one
            comp = app.project.items.addComp(
                "AI Expanded Image",
                importedFile.width,
                importedFile.height,
                1.0, // pixel aspect ratio
                10.0, // duration in seconds
                30 // frame rate
            );
            createdNew = true;
        } else {
            // Resize existing composition to match image dimensions
            comp.width = importedFile.width;
            comp.height = importedFile.height;
        }

        // Add to composition
        var layer = comp.layers.add(importedFile);

        // Center the layer in the composition
        layer.position.setValue([comp.width / 2, comp.height / 2]);

        app.endUndoGroup();

        var message = createdNew 
            ? "Created new composition '" + comp.name + "' (" + comp.width + "x" + comp.height + ") and imported image"
            : "Image imported to composition: " + comp.name + " (resized to " + comp.width + "x" + comp.height + ")";

        return JSON.stringify({
            success: true,
            message: message
        });

    } catch (e) {
        app.endUndoGroup();
        return JSON.stringify({
            success: false,
            error: "Error importing image: " + e.toString()
        });
    }
}

/**
 * Simple ping function to test connection
 * @return {string} "pong"
 */
function ping() {
    return "pong";
}

/**
 * Get information about the active composition
 * @return {string} JSON string with comp info
 */
function getActiveCompInfo() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({
                success: false,
                hasComp: false,
                message: "No active composition"
            });
        }

        return JSON.stringify({
            success: true,
            hasComp: true,
            name: comp.name,
            width: comp.width,
            height: comp.height,
            duration: comp.duration,
            frameRate: comp.frameRate
        });
    } catch (e) {
        return JSON.stringify({
            success: false,
            error: e.toString()
        });
    }
}
