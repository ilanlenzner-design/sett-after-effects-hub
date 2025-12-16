/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, Folder*/

function importImage(filePath) {
    alert("ExtendScript called with path: " + filePath);
    try {
        if (!filePath) {
            alert("No file path!");
            return "Error: No file path provided";
        }

        var file = new File(filePath);
        alert("File object created: " + file.fsName + ", Exists: " + file.exists);

        if (!file.exists) {
            return "Error: File does not exist at " + filePath;
        }

        // 1. Check if project is open, if not create new
        if (!app.project) {
            app.newProject();
        }

        // 2. Import the file
        var importOptions = new ImportOptions(file);
        var importedItem = app.project.importFile(importOptions);

        if (!importedItem) {
            return "Error: Failed to import file";
        }

        // 3. Add to active composition OR create new one
        var activeComp = app.project.activeItem;

        if (activeComp && activeComp instanceof CompItem) {
            // Add to existing active comp
            activeComp.layers.add(importedItem);
            return "Success: Imported and added to active composition";
        } else {
            // Create new composition matching image dimensions
            var compName = importedItem.name.replace(/\.[^\.]+$/, ""); // Remove extension
            var compWidth = importedItem.width;
            var compHeight = importedItem.height;
            var compPixelAspect = importedItem.pixelAspect;
            var compDuration = 10; // Default 10 seconds
            var compFrameRate = 30; // Default 30 fps

            var newComp = app.project.items.addComp(compName, compWidth, compHeight, compPixelAspect, compDuration, compFrameRate);
            newComp.layers.add(importedItem);
            newComp.openInViewer(); // Open the new comp

            return "Success: Imported and created new composition";
        }

    } catch (err) {
        return "Error: " + err.toString();
    }
}
