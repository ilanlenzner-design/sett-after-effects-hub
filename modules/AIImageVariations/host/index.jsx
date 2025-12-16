// ExtendScript for After Effects

function downloadAndImportImage(url, name) {
    try {
        // 1. Download the image
        // Since ExtendScript doesn't have native HTTP, we rely on the CEP side (Node.js) to download 
        // OR we can use a system command (curl) if we want to keep it simple in ExtendScript, 
        // BUT the best way in CEP is to download in JS (Node) and pass the path here.
        // HOWEVER, to keep it simple and self-contained if we assume the JS side handles the download:

        // Actually, let's assume the JS side downloads it and passes a LOCAL PATH.
        // It's much cleaner. The JS side has full Node.js access.

        var importPath = url; // Expecting a local file path here

        if (!importPath) {
            return JSON.stringify({
                status: 'error',
                message: 'No file path provided'
            });
        }

        var fileToImport = new File(importPath);

        if (!fileToImport.exists) {
            return JSON.stringify({
                status: 'error',
                message: 'File does not exist: ' + importPath
            });
        }

        // 2. Import into After Effects
        if (app.project) {
            var importOptions = new ImportOptions(fileToImport);

            if (importOptions.canImportAs(ImportAsType.FOOTAGE)) {
                var importedItem = app.project.importFile(importOptions);
                importedItem.name = name;

                // Optional: Add to active comp if one exists
                if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
                    app.project.activeItem.layers.add(importedItem);
                }

                return JSON.stringify({
                    status: 'success',
                    message: 'Imported successfully',
                    name: importedItem.name
                });
            }
        } else {
            return JSON.stringify({
                status: 'error',
                message: 'No active project'
            });
        }

    } catch (err) {
        return JSON.stringify({
            status: 'error',
            message: err.toString()
        });
    }
}
