import { JupyterFrontEndPlugin, JupyterFrontEnd, ILayoutRestorer } from "@jupyterlab/application";
import { IWidgetTracker, WidgetTracker } from "@jupyterlab/apputils";
import { IRegistry, widgetDataType, CSVDataType } from "@jupyterlab/dataregistry-extension";
import { IDocumentWidget } from "@jupyterlab/docregistry";
import { Token } from "@phosphor/coreutils";
import { SpreadsheetModelFactory, JupyterSpreadsheetModel } from "./modelfactory";
import { SpreadsheetWidget } from "./widget";
import { SpreadsheetWidgetFactory } from "./widgetfactory";
import {
    createConverter,
    resolveExtensionConverter,
    relativeNestedDataType,
    DataTypeStringArg,
    URLDataType,
    DataTypeNoArgs,
    resolveDataType,
} from "@jupyterlab/dataregistry";
import { SpreadsheetModel } from "./model";
import { defer, BehaviorSubject, merge, Observable, throwError } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { map, distinct, switchMap } from "rxjs/operators";

export const ISpreadsheetTracker = new Token("jupyterlab-spreadsheet:tracker");
export type ISpreadsheetTracker = IWidgetTracker<
    IDocumentWidget<SpreadsheetWidget, JupyterSpreadsheetModel>
>;

function activateSpreadsheet(
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    registry?: IRegistry,
): ISpreadsheetTracker {
    const { docRegistry } = app;
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
    docRegistry.addModelFactory(modelFactory);
    docRegistry.addWidgetFactory(factory);
    docRegistry.addFileType({
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
        const CWF_MIMETYPE = "application/vnd.sheetjs.cwf+json";
        const SheetJsWorkbookDataType = new DataTypeNoArgs<SpreadsheetModel>(CWF_MIMETYPE);

        // A datatype with an explicit sheet reference.
        // NOTE: This is _not_ the same as an activeSheet.
        const SheetJsDataType = new DataTypeStringArg<SpreadsheetModel>(CWF_MIMETYPE, "worksheet");
        
        // A datatype for shuttling Base64 around, much like the textDataType
        const Base64DataType = new DataTypeStringArg<Observable<string>>(
            "application/octet-stream",
            "mimetype"
        ); 

        registry.addConverter(
            resolveExtensionConverter(".xls", XLS_MIMETYPE),
            resolveExtensionConverter(".xlsx", XLSX_MIMETYPE),
            // A converter to go between URLs and Base64 data
            createConverter({
                from: URLDataType,
                to: Base64DataType,
            }, ({data, type}) => ({
                type: type,
                data: data.pipe(
                    distinct(),
                    switchMap(i => fromFetch(i)),
                    switchMap(i => {
                        if (!i.ok) {
                            return throwError(new Error("Bad response:" + i));
                        }
                        return i.blob()
                            .then(blob => new Promise((res, rej) => {
                                // don't you love how most DOM APIs are
                                // constructed entirely out of duct tape?
                                const reader = new FileReader();
                                reader.onerror = rej;
                                reader.onload = () => {
                                    const result = reader.result;
                                    if (result == null || reader instanceof ArrayBuffer) {
                                        return rej("Failed to load data")
                                    }
                                    res(("" + result).replace(/^data:[^;]+;base64,/, ""));
                                };
                                reader.readAsDataURL(blob);
                            }));
                    })
                )
            })),
            createConverter({
                from: Base64DataType,
                to: SheetJsWorkbookDataType,
            }, ({type, data}) => {
                if (!(type === XLS_MIMETYPE || type === XLSX_MIMETYPE)) {
                    return null;
                }
                
                return {
                    type: void 0,
                    data: new SpreadsheetModel({ value: data })
                };
            }),
            createConverter({
                from: SheetJsWorkbookDataType,
                to: widgetDataType,
            }, ({ data }) => {
                return {
                    type: "Spreadsheet",
                    data: () => new SpreadsheetWidget({model: data})
                }
            }),
            createConverter({
                from: SheetJsWorkbookDataType,
                to: relativeNestedDataType,
            }, ({data}) => ({
                    type: void 0,
                    data: defer(() => {
                        return merge(
                            new BehaviorSubject(void 0),
                            data.workbookChanged
                        ).pipe(
                            map(() => data.getSheetNames()
                                .map(i => "#/sheet/" + i)
                            )
                        )
                    })
                })
            ),
            createConverter({
                from: resolveDataType,
                to: SheetJsDataType,
            }, ({ url }) => {
                // TODO: Refactor this when the Data Registry publishes a new
                // version with UrlTemplates
                const result = /\/sheet\/([^/]+)$/.exec(url.hash);
                if (            	
                    url.protocol !== "file:" ||	
                    !(/\.xlsx?$/.test(url.pathname)) || 
                    result == null
                ) {
                    return null;
                }

                const sheetName = result[1];
                url.hash = "";
                const data = SheetJsWorkbookDataType
                    .getDataset(registry.getURL("" + url));
                if (data == null) return null;
                return {
                    type: sheetName,
                    data
                };
            }),
            createConverter({
                from: SheetJsDataType,
                to: CSVDataType
            }, ({ data, type }) => {
                return {
                    type: void 0,
                    data: defer(() => {
                        return merge(
                            new BehaviorSubject(void 0),
                            data.workbookChanged
                        ).pipe(
                            map(() => data.toCsv(type))
                        )
                    })
                };
            })
        );
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
