function importFile(path) {
    try {
        var importOptions = new ImportOptions(File(path));
        var importedFile = app.project.importFile(importOptions);

        // Add to active comp if one exists
        var activeComp = app.project.activeItem;
        if (activeComp && activeComp instanceof CompItem) {
            activeComp.layers.add(importedFile);
        }

        return "Success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}
