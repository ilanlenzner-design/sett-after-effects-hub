// BG Remover - ExtendScript Host Functions

// Simple test function
function testFunction() {
    return "TEST_SUCCESS";
}

// Get selected layer or project item file path
function getLayer() {
    try {
        var sourceItem = null;
        var layerName = "";

        // Strategy 1: Check active composition for selected layers
        var comp = app.project.activeItem;
        if (comp && (comp instanceof CompItem)) {
            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length > 0) {
                var layer = selectedLayers[0];
                if (layer.source && (layer.source instanceof FootageItem)) {
                    sourceItem = layer.source;
                    layerName = layer.name;
                }
            }
        }

        // Strategy 2: Check project panel selection if no layer found
        if (!sourceItem) {
            var projectSelection = app.project.selection;
            if (projectSelection && projectSelection.length > 0) {
                for (var i = 0; i < projectSelection.length; i++) {
                    var item = projectSelection[i];
                    if (item instanceof FootageItem) {
                        sourceItem = item;
                        layerName = item.name;
                        break; // Just take the first valid footage item
                    }
                }
            }
        }

        if (!sourceItem) {
            return '{"error": "No image selected. Please select a Layer in a Composition or an Image in the Project Panel."}';
        }

        var sourceFile = sourceItem.file;
        if (!sourceFile || !sourceFile.exists) {
            return '{"error": "Source file not found (Item might be missing media)"}';
        }

        // Manual JSON construction
        var json = '{';
        json += '"filePath": "' + sourceFile.fsName.replace(/\\/g, '\\\\') + '",';
        json += '"layerName": "' + layerName + '",';
        json += '"width": ' + sourceItem.width + ',';
        json += '"height": ' + sourceItem.height;
        json += '}';

        return json;
    } catch (e) {
        return '{"error": "' + e.toString() + '"}';
    }
}

// Import file from path
function importFile(filePath) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            comp = app.project.items.addComp("New Composition", 1920, 1080, 1.0, 10.0, 30);
        }

        var fileToImport = new File(filePath);

        if (!fileToImport.exists) {
            return '{"error": "File does not exist at location: ' + filePath.replace(/\\/g, '/') + '"}';
        }

        var importOptions = new ImportOptions(fileToImport);
        var footage = app.project.importFile(importOptions);

        // Rename footage to avoid confusion
        footage.name = "BG_Removed_" + Math.floor(Math.random() * 1000) + ".png";

        var layer = comp.layers.add(footage);
        layer.position.setValue([comp.width / 2, comp.height / 2]);

        // Don't delete immediately, let AE cache it
        // tempFile.remove(); 

        return '{"success": true, "layerName": "' + layer.name + '"}';
    } catch (e) {
        return '{"error": "' + e.toString() + '"}';
    }
}

function decodeBase64(input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {
        var enc1 = keyStr.indexOf(input.charAt(i++));
        var enc2 = keyStr.indexOf(input.charAt(i++));
        var enc3 = keyStr.indexOf(input.charAt(i++));
        var enc4 = keyStr.indexOf(input.charAt(i++));

        var chr1 = (enc1 << 2) | (enc2 >> 4);
        var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        var chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) output = output + String.fromCharCode(chr2);
        if (enc4 != 64) output = output + String.fromCharCode(chr3);
    }
    return output;
}
