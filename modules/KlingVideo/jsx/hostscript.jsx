function isObject(arr) {
    var type = typeof arr;
    return type === 'function' || type === 'object' && !!arr;
}

function getSelectedLayerInfo() {
    try {
        var activeItem = app.project.activeItem;
        var sourcePath = "";
        var name = "";
        var width = 0;
        var height = 0;
        var hasSource = false;

        // CASE 1: Active Item is a Composition (User selected a layer)
        if (activeItem && activeItem instanceof CompItem) {
            if (activeItem.selectedLayers.length === 0) {
                return '{"error":"No layer selected in Composition"}';
            }
            var layer = activeItem.selectedLayers[0];
            name = layer.name;
            width = layer.width;
            height = layer.height;
            if (layer.source && layer.source.file) {
                sourcePath = layer.source.file.fsName;
                hasSource = true;
            }
        }
        // CASE 2: Active Item is Footage (User selected an image in Project Panel)
        else if (activeItem && activeItem instanceof FootageItem) {
            name = activeItem.name;
            width = activeItem.width;
            height = activeItem.height;
            if (activeItem.file) {
                sourcePath = activeItem.file.fsName;
                hasSource = true;
            } else {
                return '{"error":"Selected project item has no file"}';
            }
        }
        // CASE 3: Nothing or invalid selection
        else {
            // Try checking selected items in project bin if activeItem is null (sometimes happens)
            if (app.project.selection.length > 0 && app.project.selection[0] instanceof FootageItem) {
                var item = app.project.selection[0];
                name = item.name;
                width = item.width;
                height = item.height;
                if (item.file) {
                    sourcePath = item.file.fsName;
                    hasSource = true;
                }
            } else {
                return '{"error":"No active Composition or valid Footage selected"}';
            }
        }

        // Manual JSON stringify
        var json = '{';
        json += '"name":"' + name.replace(/"/g, '\\\\"') + '",';
        json += '"width":' + width + ',';
        json += '"height":' + height + ',';
        json += '"sourcePath":"' + sourcePath.replace(/\\/g, '\\\\').replace(/"/g, '\\\\"') + '"';
        json += '}';

        return json;
    } catch (e) {
        return '{"error":"' + e.toString().replace(/"/g, '\\\\"') + '"}';
    }
}

function importVideo(path) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }

        var importOptions = new ImportOptions(new File(path));
        if (!importOptions.file.exists) {
            return "Error: File does not exist: " + path;
        }

        var footage = app.project.importFile(importOptions);
        if (!footage) {
            return "Error: Failed to import file";
        }

        var newLayer = comp.layers.add(footage);
        newLayer.moveToBeginning();

        // Select only the new layer
        for (var i = 1; i <= comp.selectedLayers.length; i++) {
            comp.selectedLayers[i - 1].selected = false;
        }
        newLayer.selected = true;

        return "success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}
