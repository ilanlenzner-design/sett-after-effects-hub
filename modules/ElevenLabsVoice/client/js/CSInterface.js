/**
 * CSInterface - v9.0.0
 * 
 * Simple implementation for basic CEP functionality.
 */
var CSInterface = function () { };

CSInterface.prototype.evalScript = function (script, callback) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.evalScript(script, callback);
    } else {
        console.warn("CSInterface: window.__adobe_cep__ is missing.");
    }
};

CSInterface.prototype.getHostEnvironment = function () {
    if (window.__adobe_cep__) {
        return JSON.parse(window.__adobe_cep__.getHostEnvironment());
    }
    return null;
};

CSInterface.prototype.closeExtension = function () {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.closeExtension();
    }
};

CSInterface.prototype.getSystemPath = function (pathType) {
    if (window.__adobe_cep__) {
        var path = window.__adobe_cep__.getSystemPath(pathType);
        return path;
    }
    return null;
};

// SystemPath definitions
var SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};

// Import definitions
var ImportOptions = function (file) {
    this.file = file;
};

var ImportAsType = {
    FOOTAGE: "footage",
    COMP: "composition",
    PROJECT: "project"
};
