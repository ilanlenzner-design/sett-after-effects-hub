// Debugging Helper Script
// This file can help test the ExtendScript functions independently

// Test getSelectedLayer
var layerResult = getSelectedLayer();
alert("Layer Result: " + layerResult);

// If you have a layer selected, test export
var exportResult = exportSelectedLayer();
alert("Export Result: " + exportResult);
