import { JupyterFrontEndPlugin, JupyterFrontEnd, ILayoutRestorer } from "@jupyterlab/application";
import { IWidgetTracker, WidgetTracker } from "@jupyterlab/apputils";
import { IRegistry, widgetDataType } from "@jupyterlab/dataregistry-extension";
import { IDocumentWidget } from "@jupyterlab/docregistry";
import { Token } from "@phosphor/coreutils";
import { SpreadsheetModel } from "./model";
import { SpreadsheetModelFactory } from "./modelfactory";
import { SpreadsheetWidget } from "./widget";
import { SpreadsheetWidgetFactory } from "./widgetfactory";
import { createConverter, DataTypeNoArgs, resolveExtensionConverter } from "@jupyterlab/dataregistry";
import { BoxLayout, Widget } from "@phosphor/widgets";

export const ISpreadsheetTracker = new Token("jupyterlab-spreadsheet:tracker");
export type ISpreadsheetTracker = IWidgetTracker<IDocumentWidget<SpreadsheetWidget, SpreadsheetModel>>;

function activateSpreadsheet(
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    registry?: IRegistry,
): ISpreadsheetTracker {
    const tracker = new WidgetTracker<IDocumentWidget<SpreadsheetWidget, SpreadsheetModel>>({
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
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/octet-stream",
            "text/plain"
        ]
    });
    
    if (registry) {
        const XLSDatatype = new DataTypeNoArgs("application/vnd.ms-excel");
        const XLSXDataType = new DataTypeNoArgs("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        
        registry.addConverter(
            createConverter({
                from: XLSDatatype,
                to: widgetDataType
            }, () => {
                return {
                    type: "Spreadsheet",
                    data: () => (new Widget())
                }
            }),
            createConverter({
                    from: XLSXDataType,
                    to: widgetDataType
            }, () => {
                return {
                    type: "Spreadsheet",
                    data: () => (new Widget())
                }
            })
        );

        registry.addConverter(
            resolveExtensionConverter(".xls", "application/vnd.ms-excel"),
            resolveExtensionConverter(".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        )
    }

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

const plugin: JupyterFrontEndPlugin<ISpreadsheetTracker> = {
    id: "jupyter-spreadsheet",
    autoStart: true,
    requires: [ILayoutRestorer],
    optional: [IRegistry],
    provides: ISpreadsheetTracker,
    activate: activateSpreadsheet
};

export default plugin;
