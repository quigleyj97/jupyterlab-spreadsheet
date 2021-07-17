import { read, WorkBook, utils } from "xlsx";
import { Observable, Subscription, Subject } from "rxjs";
import { IDisposable } from "@lumino/disposable";

export class SpreadsheetModel
    implements
        Slick.DataProvider<SpreadsheetModel.SpreadsheetData>,
        IDisposable
{
    private _workbook: WorkBook | undefined;
    private _workbookChanged = new Subject<void>();
    private _sheetChanged = new Subject<string>();
    private _activeSheet: string | null = null;
    private _subscription: Subscription; 
    private _isDisposed = false;
    private _value: Observable<string>;

    constructor({value}: SpreadsheetModel.IOptions) {
        this._value = value;
        this._subscription = value.subscribe(this.handleContentChanged.bind(this));
    }

    public get isDisposed() {
        return this._isDisposed;
    }

    public get workbookChanged(): Observable<void> {
        return this._workbookChanged;
    }

    /** A Signal that emits whenever the selected sheet has changed.
     *
     * Changes of this nature often require a re-render of the slickgrid
     */
    public get sheetChanged(): Observable<string> {
        return this._sheetChanged;
    }

    /** Return the currently selected sheet, or null if no sheet is selected */
    public get activeSheet(): string | null {
        return this._activeSheet;
    }

    /**
     * Dispose all resources held by this model, including the worksheet model.
     * This will render the model unusable.
     */
    public dispose() {
        if (this._isDisposed) {
            return;
        }

        this._sheetChanged.complete();
        this._workbookChanged.complete();
        this._subscription.unsubscribe();

        // Make sure that the workbook isn't pinned in memory by this object
        delete this._workbook;
    }

    /**
     * Set the worksheet to display, and trigger the sheetChanged event.
     * @see sheetChanged
     */
    public setSheet(name: string) {
        this._activeSheet = name;
        this._sheetChanged.next(name);
    }

    /**
     * Get the sheet names for the active workbook.
     *
     * If the workbook is null, this will return an empty array.
     */
    public getSheetNames(): string[] {
        if (this._workbook == null) {
            return [];
        }
        return this._workbook.SheetNames;
    }

    /**
     * Returns the extent of the current sheet, from the top-left A1 column to
     * the bottom-right-most cell, so that views can calculate columns and
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
        // This range is _not_ from the top-left cell! It's from the first
        // cell _with_ data, so it can actually skip rows/columns. We can't
        // allow this as it'll cause misaligned rendering.
        const sheetRangeExclusive = utils.decode_range(range);
        // force the start of the range to be the top-most cell, always
        sheetRangeExclusive.s = {c: 0, r: 0};
        return sheetRangeExclusive;
    }

    /**
     * Returns the number of rows in the active worksheet
     */
    public getLength() {
        const extent = this.getExtent();
        // `end.row - start.row` plus one, since end is inclusive
        return extent.e.r - extent.s.r + 1;
    }

    /**
     * Returns the SlickGrid model for a single row
     */
    public getItem(r: number): SpreadsheetModel.SpreadsheetData {
        const rowModel: SpreadsheetModel.SpreadsheetData = {id: r};
        if (this._workbook == null || this._activeSheet == null) {
            return Object.freeze(rowModel);
        }
        const sheetData = this._workbook.Sheets[this._activeSheet];
        const range = this.getExtent();
        // `end.col - start.col`
        const nCols = range.e.c - range.s.c;
        for (let c = 0; c <= nCols; c++) {
            const cell = utils.encode_cell({r, c});
            let data: unknown = null;
            if (cell in sheetData) {
                data = sheetData[cell];
            }
            rowModel["c" + c] = data;
        }
        return Object.freeze(rowModel);
    }

    public getItemMetadata(index: number): SpreadsheetModel.SpreadsheetMetadata {
        const metadata: SpreadsheetModel.SpreadsheetMetadata = {
            columns: {}
        };
        if (this._workbook == null || this._activeSheet == null) {
            return Object.freeze(metadata);
        }
        const sheetData = this._workbook.Sheets[this._activeSheet];
        if (sheetData["!merges"] == null) {
            return Object.freeze(metadata);
        }
        const merges = sheetData["!merges"];
        for (let i = 0; i < merges.length; i++) {
            const merge = merges[i];
            if (index < merge.s.r || merge.e.r < index) {
                continue;
            }
            // whether the merge continues below this row
            const mergeDown = merge.e.r - merge.s.r > 0 && index < merge.e.r;
            // eslint-disable-next-line
            metadata.columns!["c" + merge.s.c] = { 
                colspan: merge.e.c - merge.s.c + 1, //end inclusive
                mergeDown
            };
        }
        return Object.freeze(metadata);
    }

    /**
     * Returns a SlickGrid column config, respecting formatting options in the sheet
     * @param sheetData The worksheet to generate the columns from
     */
    public getColumnConfig(): SpreadsheetModel.ColumnList {
        if (this._workbook == null || this._activeSheet == null) {
            return [];
        }
        const sheetData = this._workbook.Sheets[this._activeSheet];
        const range = this.getExtent();
        const config: SpreadsheetModel.ColumnList = [
            {
                // row number
                id: "row",
                name: "#",
                field: "id",
                cssClass: "sp-Row-Index",
                headerCssClass: "sp-GridHeader",
                formatter: (cell, row, value) => "" + (1 + value)
            }
        ];
        for (let i = range.s.c; i <= range.e.c; i++) {
            const colName = utils.encode_col(i);
            const colWidth = (sheetData["!cols"]) ? sheetData["!cols"][i].width : void 0;
            config.push({
                id: "c" + i,
                name: colName,
                field: "c" + i,
                width: colWidth,
                headerCssClass: "sp-GridHeader"
            });
        }
        return config;
    }

    /**
     * Convert the active sheet to a CSV and return it.
     */
    public toCsv(sheetName?: string) {
        const sheetToConv = sheetName || this._activeSheet;
        if (this._workbook == null || sheetToConv == null) {
            return null; // no conversion possible
        }
        const sheet = this._workbook.Sheets[sheetToConv];
        return utils.sheet_to_csv(sheet, {
            FS: ","
        });
    }

    private handleContentChanged(content: string) {
        this._workbook = read(content);
        this._activeSheet = this._workbook.SheetNames[0];
        this._workbookChanged.next(void 0);
    }
}

export namespace SpreadsheetModel {
    export interface IOptions {
        value: Observable<string>;
    }

    export interface SpreadsheetData extends Slick.SlickData {
        /** The cells of this row */
        [colIndex: string]: unknown;
        /** The index of this row */
        id: number;
    }

    export interface SpreadsheetMetadata extends Slick.RowMetadata<SpreadsheetData> {
        columns?: {
            [colIndex: string]: SpreadsheetColumnMetadata;
        };
    }

    export interface SpreadsheetColumnMetadata extends Slick.ColumnMetadata<SpreadsheetData> {
        mergeDown?: boolean;
    }

    export type ColumnList = Array<Slick.Column<SpreadsheetData>>;
}
