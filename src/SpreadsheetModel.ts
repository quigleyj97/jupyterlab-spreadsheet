import { read, WorkBook } from "xlsx";
import { DocumentModel } from "@jupyterlab/docregistry";
import { ModelDB } from "@jupyterlab/observables";

export class SpreadsheetModel extends DocumentModel {
    private workbook: WorkBook | undefined;

    constructor({modelDB}: SpreadsheetModelNS.IOptions) {
        // don't create a kernel
        super(void 0, modelDB);
        this.value.changed.connect(this.handleContentChanged, this);
        // we don't support editing (yet)
        this.readOnly = true;
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }

        this.value.changed.disconnect(this.handleContentChanged, this);
        delete this.workbook;
    }

    protected handleContentChanged() {
        this.workbook = read(this.value.text);
        console.log("Workbook loaded: ", this.workbook);
    }
}

export namespace SpreadsheetModelNS {
    export interface IOptions {
        /** ModelDB to be passed to the DocumentModel */
        modelDB?: ModelDB;
    }
}
