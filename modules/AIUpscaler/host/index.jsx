function getSelectedImage() {
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return JSON.stringify({ error: "Please open a composition." });
        }
        var comp = app.project.activeItem;
        if (comp.selectedLayers.length === 0) {
            return JSON.stringify({ error: "Please select a layer." });
        }
        var layer = comp.selectedLayers[0];
        // Check if it's a solid/text/shape or file
        // layer.source is null for text/shapes usually. 
        // For solids, layer.source.mainSource instanceof SolidSource.
        // We want FileSource.
        
        if (!layer.source || !layer.source.file) {
             return JSON.stringify({ error: "Selected layer must be a source file (image/video)." });
        }
        
        return JSON.stringify({
            path: layer.source.file.fsName,
            name: layer.name,
            width: layer.width,
            height: layer.height
        });
    } catch(e) {
        return JSON.stringify({ error: e.toString() });
    }
}

function importUpscaledImage(path, name) {
    try {
        var file = new File(path);
        if (!file.exists) return JSON.stringify({ error: "File not found: " + path });
        
        var io = new ImportOptions(file);
        if (io.canImportAs(ImportAsType.FOOTAGE)) {
            var item = app.project.importFile(io);
            if (name) item.name = name;
            
            if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
                 app.project.activeItem.layers.add(item);
            }
            return JSON.stringify({ success: true, name: item.name });
        }
        return JSON.stringify({ error: "Cannot import as footage." });
    } catch(e) {
        return JSON.stringify({ error: e.toString() });
    }
}
