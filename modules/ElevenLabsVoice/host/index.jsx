function log(msg) {
    // Basic logging to JS console via callback if needed, or Write to file
    // For now, simple alert or mute
}

function importAudioFile(filePath) {
    try {
        var importOptions = new ImportOptions(new File(filePath));
        if (importOptions.canImportAs(ImportAsType.FOOTAGE)) {
            var importedStuff = app.project.importFile(importOptions);
            
            // Add to active comp if exists
            var comp = app.project.activeItem;
            if (comp && comp instanceof CompItem) {
                comp.layers.add(importedStuff);
                return "Successfully imported and added to composition.";
            } else {
                return "Imported to project, but no active composition found to add layer.";
            }
        } else {
            return "Failed to import: Cannot import as footage.";
        }
    } catch (err) {
        return "Error: " + err.toString();
    }
}
