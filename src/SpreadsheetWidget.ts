import { Widget } from "@phosphor/widgets";
import { SpreadsheetModelNS, SpreadsheetModel } from "./SpreadsheetModel";
import "slickgrid/lib/jquery-1.8.3.js";
import "slickgrid/lib/jquery.event.drag-2.2.js";
import "slickgrid/slick.core.js";
import "slickgrid/slick.dataview.js";

export class SpreadsheetWidget extends Widget {
    private readonly view: Slick.Data.DataView<SpreadsheetModelNS.SpreadsheetData>;
    private readonly model: SpreadsheetModel;

    constructor({model}: SpreadsheetWidgetNS.IOptions) {
        super();
        this.model = model;
        this.view = new Slick.Data.DataView();
        this.model.workbookContentChanged.connect(this.handleModelContentChanged, this);
    }

    /**
     * Setup the grid once the model has been loaded
     */
    public initialize() {
        this.loadDataIntoView();
        console.log("Data loaded", this.view);
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }
        // TODO: Should the model be disposed as well?
        this.model.contentChanged.disconnect(this.handleModelContentChanged, this);
        super.dispose();
    }

    private handleModelContentChanged() {
        this.initialize();
    }

    private loadDataIntoView() {
        const data = this.model.getSheet();
        const rows = this.model.getSpreadsheetData(data);
        this.view.beginUpdate();
        this.view.setItems(rows);
        this.view.endUpdate();
    }
}

export namespace SpreadsheetWidgetNS {
    export interface IOptions {
        model: SpreadsheetModel;
    }
}
