import { JupyterLabPlugin, JupyterLab } from "@jupyterlab/application";
import { SpreadsheetWidgetFactory } from "./SpreadsheetWidgetFactory";
import { SpreadsheetModelFactory } from "./SpreadsheetModelFactory";

function activateSpreadsheet(app: JupyterLab) {
    const factory = new SpreadsheetWidgetFactory({
        name: "Spreadsheet",
        modelName: "workbook",
        fileTypes: [
            "excel",
            "csv",
            "dsv"
        ],
        defaultFor: [
            "excel",
        ],
    });
    const modelFactory = new SpreadsheetModelFactory();
    app.docRegistry.addModelFactory(modelFactory);
    app.docRegistry.addWidgetFactory(factory);
    app.docRegistry.addFileType({
        name: "excel",
        displayName: "Excel Workbook",
        fileFormat: "base64",
        extensions: [
            ".xls",
            ".xlsx"
        ],
        mimeTypes: [
            "application/octet-stream",
            "text/plain"
        ]
    });
}

const plugin: JupyterLabPlugin<void> = {
    id: "jupyter-spreadsheet",
    autoStart: true,
    activate: activateSpreadsheet
}

export default plugin;