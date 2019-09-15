import { JupyterFrontEndPlugin, JupyterFrontEnd, ILayoutRestorer } from "@jupyterlab/application";
import { IWidgetTracker, WidgetTracker } from "@jupyterlab/apputils";
import { IRegistry, widgetDataType } from "@jupyterlab/dataregistry-extension";
import { IDocumentWidget } from "@jupyterlab/docregistry";
import { Token } from "@phosphor/coreutils";
import { SpreadsheetModelFactory, JupyterSpreadsheetModel } from "./modelfactory";
import { SpreadsheetWidget } from "./widget";
import { SpreadsheetWidgetFactory } from "./widgetfactory";
import { createConverter, resolveExtensionConverter, fileDataType } from "@jupyterlab/dataregistry";
import { Widget } from "@phosphor/widgets";

export const ISpreadsheetTracker = new Token("jupyterlab-spreadsheet:tracker");
export type ISpreadsheetTracker = IWidgetTracker<
    IDocumentWidget<SpreadsheetWidget, JupyterSpreadsheetModel>
>;

function activateSpreadsheet(
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    registry?: IRegistry,
): ISpreadsheetTracker {
    const tracker = new WidgetTracker<
        IDocumentWidget<SpreadsheetWidget, JupyterSpreadsheetModel>
    >({
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
        const XLS_MIMETYPE = "application/vnd.ms-excel";
        const XLSX_MIMETYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        // const SheetJsDataType = new DataTypeNoArgs("application/vnd.sheetjs.cwf+json");

        registry.addConverter(
            resolveExtensionConverter(".xls", XLS_MIMETYPE),
            resolveExtensionConverter(".xlsx", XLSX_MIMETYPE),
            createConverter({
                from: fileDataType,
                to: widgetDataType,
            }, ({type}) => {
                if (!(type === XLS_MIMETYPE || type === XLSX_MIMETYPE)) {
                    return null;
                }
                return {
                    type: "Spreadsheet",
                    data: () => new Widget()
                }
            })
        )
        
        // registry.addConverter(
        //     createConverter({
        //         from: XLSDatatype,
        //         to: CSVDataType
        //     }, () => {
        //         return {
        //             type: void 0,
        //             data: new Observable<string>(s => {
        //                 s.next("a,b\nThis,is\nA,Test");
        //             })
        //         };
        //     }),
        // );
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
