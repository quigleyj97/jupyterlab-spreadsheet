import { JupyterLabPlugin, JupyterLab, ILayoutRestorer } from "@jupyterlab/application";
import { SpreadsheetWidgetFactory } from "./SpreadsheetWidgetFactory";
import { SpreadsheetModelFactory } from "./SpreadsheetModelFactory";
import { Token } from "@phosphor/coreutils";
import { InstanceTracker, IInstanceTracker } from "@jupyterlab/apputils";
import { SpreadsheetWidget } from "./SpreadsheetWidget";
import { IDocumentWidget } from "@jupyterlab/docregistry";
import { SpreadsheetModel } from "./SpreadsheetModel";

const ISpreadsheetTracker = new Token("jupyterlab-spreadsheet:tracker");
type ISpreadsheetTracker = IInstanceTracker<IDocumentWidget<SpreadsheetWidget, SpreadsheetModel>>;

function activateSpreadsheet(app: JupyterLab,
                             restorer: ILayoutRestorer): ISpreadsheetTracker {
    const tracker = new InstanceTracker<IDocumentWidget<SpreadsheetWidget, SpreadsheetModel>>({
        namespace: "jupyterlab-spreadsheet"
    });
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
    factory.widgetCreated.connect((sender, widget) => {
        tracker.add(widget);
        widget.context.pathChanged.connect(() => {
            tracker.save(widget);
        });
    });
    restorer.restore(tracker, {
        command: "docmanager:open",
        args: widget => ({path: widget.context.path, factory: "Spreadsheet"}),
        name: widget => widget.context.path
    });
    return tracker;
}

const plugin: JupyterLabPlugin<ISpreadsheetTracker> = {
    id: "jupyter-spreadsheet",
    autoStart: true,
    requires: [ILayoutRestorer],
    provides: ISpreadsheetTracker,
    activate: activateSpreadsheet
};

export default plugin;
