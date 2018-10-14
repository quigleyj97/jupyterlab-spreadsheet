import { read, WorkBook, WorkSheet, utils } from "xlsx";
import { DocumentModel } from "@jupyterlab/docregistry";
import { ModelDB } from "@jupyterlab/observables";
import { Signal, ISignal } from "@phosphor/signaling";

export class SpreadsheetModel extends DocumentModel {
    private _workbook: WorkBook | undefined;
    private _workbookContentChanged = new Signal<this, void>(this);

    constructor({modelDB}: SpreadsheetModelNS.IOptions) {
        // don't create a kernel
        super(void 0, modelDB);
        this.value.changed.connect(this.handleContentChanged, this);
        // we don't support editing (yet)
        this.readOnly = true;
    }

    public get workbookContentChanged(): ISignal<this, void> {
        return this._workbookContentChanged;
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }

        this.value.changed.disconnect(this.handleContentChanged, this);
        delete this._workbook;
    }

    /**
     * Retrieve an individual spreadsheet from a given workbook.
     * @throws if sheetName is not included in the workbook
     * @throws if the workbook is not defined (meaning, it hasn't yet been loaded)
     * @param sheetName Name of a sheet in the file. Defaults to the first sheet
     */
    public getSheet(sheetName?: string) {
        if (this._workbook == null) {
            throw Error("Workbook not loaded");
        }
        if (sheetName == null) {
            sheetName = this._workbook.SheetNames[0];
        }
        if (!(sheetName in this._workbook.Sheets)) {
            throw Error("Sheet name " + sheetName + " not in workbook");
        }
        return this._workbook.Sheets[sheetName];
    }

    /**
     * Returns the extent of a sheet's data, so that views can calculate the required number of
     * columns
     */
    public getExtent(sheetData: WorkSheet) {
        // if undefined, SheetJS spec allows us to assume it is empty
        // cf. https://github.com/SheetJS/js-xlsx#sheet-objects, "Special Sheet Keys"
        // TODO: Low: Inspect sheet data to attempt to guess at the true size
        const range = sheetData["!ref"] || "A1:A1";
        return utils.decode_range(range);
    }

    /**
     * Reads from the sheet and returns a JSON records format for direct consumption by SlickGrid.
     * This operation is expensive, and should only be called on content updates.
     */
    public getSpreadsheetData(sheetData: WorkSheet) {
        const range = this.getExtent(sheetData);
        // `end.col - start.col` and `end.row - start.row`, respectively
        const n_cols = range.e.c - range.s.c;
        const n_rows = range.e.r - range.s.r;
        // TODO: Performance: Audit this snippet on large datasets
        const records = [];
        for (let r = 0; r < n_rows; r++) {
            const row: SpreadsheetModelNS.SpreadsheetData = Object.assign([], {id: r});
            for (let c = 0; c < n_cols; c++) {
                const cell = utils.encode_cell({c, r});
                row[c] = sheetData[cell];
            }
            records.push(row);
        }
        return records;
    }

    private handleContentChanged() {
        this._workbook = read(this.value.text);
        this._workbookContentChanged.emit(void 0);
    }
}

export namespace SpreadsheetModelNS {
    export interface IOptions {
        /** ModelDB to be passed to the DocumentModel */
        modelDB?: ModelDB;
    }

    export interface SpreadsheetData extends Slick.SlickData {
        /** The cells of this row */
        [colIndex: number]: unknown;
        length: number;
        /** The index of this row */
        id: number;
    }
}
