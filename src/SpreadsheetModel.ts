import { read, WorkBook, WorkSheet, utils } from "xlsx";
import { DocumentModel } from "@jupyterlab/docregistry";
import { ModelDB } from "@jupyterlab/observables";
import { Signal, ISignal } from "@phosphor/signaling";
import { PromiseDelegate } from "@phosphor/coreutils";

export class SpreadsheetModel
            extends DocumentModel
            implements Slick.DataProvider<SpreadsheetModelNS.SpreadsheetData> {
    private _workbook: WorkBook | undefined;
    private _workbookChanged = new Signal<this, void>(this);
    private _sheetChanged = new Signal<this, string>(this);
    private _activeSheet: string | null = null;

    constructor({modelDB}: SpreadsheetModelNS.IOptions) {
        // don't create a kernel
        super(void 0, modelDB);
        this.value.changed.connect(this.handleContentChanged, this);
        // we don't support editing (yet)
        this.readOnly = true;
    }

    public get workbookChanged(): ISignal<this, void> {
        return this._workbookChanged;
    }

    /** A Signal that emits whenever the selected sheet has changed.
     *
     * Changes of this nature often require a re-render of the slickgrid
     */
    public get sheetChanged(): ISignal<this, string> {
        return this._sheetChanged;
    }

    /**
     * Dispose all resources held by this model, including the worksheet model.
     * This will render the model unusable.
     */
    public dispose() {
        if (this.isDisposed) {
            return;
        }

        this.value.changed.disconnect(this.handleContentChanged, this);
        delete this._workbook;
    }

    /**
     * Set the worksheet to display, and trigger the sheetChanged event.
     * @see sheetChanged
     */
    public setSheet(name: string) {
        this._activeSheet = name;
    }

    /**
     * Returns the extent of the current sheet, so that views can calculate columns and
     * row numbers.
     */
    public getExtent() {
        if (this._activeSheet == null || this._workbook == null) {
            return {s: {c: 0, r: 0}, e: {c: 0, r: 0}};
        }
        const sheetData = this._workbook.Sheets[this._activeSheet];
        // if undefined, SheetJS spec allows us to assume it is empty
        // cf. https://github.com/SheetJS/js-xlsx#sheet-objects, "Special Sheet Keys"
        // TODO: Low: Inspect sheet data to attempt to guess at the true size
        const range = sheetData["!ref"] || "A1:A1";
        return utils.decode_range(range);
    }

    /**
     * Returns the number of rows in the active worksheet
     */
    public getLength() {
        const extent = this.getExtent();
        // `end.row - start.row`
        return extent.e.r - extent.s.r;
    }

    /**
     * Returns the SlickGrid model for a single row
     */
    public getItem(r: number): SpreadsheetModelNS.SpreadsheetData {
        const rowModel: SpreadsheetModelNS.SpreadsheetData & Array<any> = Object.assign(
            [],
            {id: r}
        );
        if (this._workbook == null || this._activeSheet == null) {
            return Object.freeze(rowModel as SpreadsheetModelNS.SpreadsheetData);
        }
        const sheetData = this._workbook.Sheets[this._activeSheet];
        const range = this.getExtent();
        // `end.col - start.col`
        const n_cols = range.e.c - range.s.c;
        for (let c = 0; c < n_cols; c++) {
            const cell = utils.encode_cell({r, c});
            if (!(cell in sheetData)) {
                continue;
            }
            const data = sheetData[cell];
            rowModel.push(data.w || data.v);
        }
        return Object.freeze(rowModel as SpreadsheetModelNS.SpreadsheetData);
    }

    /**
     * Returns a SlickGrid column config, respecting formatting options in the sheet
     * @param sheetData The worksheet to generate the columns from
     */
    public getColumnConfig(): SpreadsheetModelNS.ColumnList {
        if (this._workbook == null || this._activeSheet == null) {
            return [];
        }
        const sheetData = this._workbook.Sheets[this._activeSheet];
        const range = this.getExtent();
        const config: SpreadsheetModelNS.ColumnList = [
            {
                // row number
                id: "row",
                name: "#",
                field: "id",
                cssClass: "sp-Row-Index",
                headerCssClass: "sp-GridHeader"
            }
        ];
        for (let i = range.s.c; i < range.e.c; i++) {
            const colName = utils.encode_col(i);
            config.push({
                // we use type casts because we need this to be a number
                // the typings in this case are too strict
                id: i as any,
                name: colName,
                field: i as any,
                width: (sheetData["!cols"] || {} as any)[colName],
                headerCssClass: "sp-GridHeader"
            });
        }
        return config;
    }

    private handleContentChanged() {
        this._workbook = read(this.value.text);
        this._activeSheet = this._workbook.SheetNames[0];
        this._workbookChanged.emit(void 0);
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

    export type ColumnList = Array<Slick.Column<SpreadsheetData>>;
}
