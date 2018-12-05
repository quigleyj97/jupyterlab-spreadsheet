import { Base64ModelFactory } from "@jupyterlab/docregistry";
import { ModelDB } from "@jupyterlab/observables";
import { SpreadsheetModel } from "./model";

export class SpreadsheetModelFactory extends Base64ModelFactory {
    public createNew(languagePreference?: string, modelDB?: ModelDB) {
        return new SpreadsheetModel({ modelDB });
    }
    get name() {
        return "workbook";
    }
}
