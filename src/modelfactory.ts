import { Base64ModelFactory, DocumentModel } from "@jupyterlab/docregistry";
import { IModelDB } from "@jupyterlab/observables";
import { SpreadsheetModel } from "./model";
import { Subject } from "rxjs";

export class JupyterSpreadsheetModel extends DocumentModel {
    private _model: SpreadsheetModel;
    private _observable = new Subject<string>();

    constructor(modelDB?: IModelDB) {
        super(void 0, modelDB);
        this._model = new SpreadsheetModel({
            value: this._observable
        });
        this._observable.next(this.value.text);
        this.value.changed.connect(this.valueChanged, this);
    }

    public get model() { return this._model; }

    dispose() {
        if (this.isDisposed) return;

        this._observable.complete();
        this.value.changed.disconnect(this.valueChanged, this);

        this._model.dispose();
    }

    private valueChanged() {
        this._observable.next(this.value.text);
    }
}

export class SpreadsheetModelFactory extends Base64ModelFactory {
    public createNew(languagePreference?: string, modelDB?: IModelDB) {
        return new JupyterSpreadsheetModel( modelDB );
    }

    get name() {
        return "workbook";
    }
}
