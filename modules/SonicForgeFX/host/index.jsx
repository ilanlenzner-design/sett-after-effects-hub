// ExtendScript for After Effects

function importAudio(path, name) {
    try {
        var fileToImport = new File(path);

        if (!fileToImport.exists) {
            return JSON.stringify({
                status: 'error',
                message: 'File does not exist: ' + path
            });
        }

        // Import into After Effects
        if (app.project) {
            var importOptions = new ImportOptions(fileToImport);

            if (importOptions.canImportAs(ImportAsType.FOOTAGE)) {
                var importedItem = app.project.importFile(importOptions);
                importedItem.name = name;

                // Add to active comp if one exists
                if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
                    app.project.activeItem.layers.add(importedItem);
                }

                return JSON.stringify({
                    status: 'success',
                    message: 'Imported successfully',
                    name: importedItem.name
                });
            } else {
                return JSON.stringify({
                    status: 'error',
                    message: 'Cannot import as footage'
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
