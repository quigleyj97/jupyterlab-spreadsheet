import { Base64ModelFactory, DocumentModel, DocumentRegistry } from "@jupyterlab/docregistry";
import { SpreadsheetModel } from "./model";
import { Subject } from "rxjs";
import { ISharedFile } from "@jupyter/ydoc";

export class JupyterSpreadsheetModel extends DocumentModel {
    private _model: SpreadsheetModel;
    private _observable = new Subject<string>();

    constructor(options: DocumentRegistry.IModelOptions<ISharedFile>) {
        super(options);
        this._model = new SpreadsheetModel({
            value: this._observable
        });
        this._observable.next(this.toString());
        this.contentChanged.connect(this.valueChanged, this);
    }

    public get model() { return this._model; }

    dispose() {
        if (this.isDisposed) return;

        this._observable.complete();
        this.contentChanged.disconnect(this.valueChanged, this);

        this._model.dispose();
    }

    private valueChanged() {
        this._observable.next(this.toString());
    }
}

export class SpreadsheetModelFactory extends Base64ModelFactory {
    public createNew(options: DocumentRegistry.IModelOptions<ISharedFile>) {
        return new JupyterSpreadsheetModel( options );
    }

    get name() {
        return "workbook";
    }
}
