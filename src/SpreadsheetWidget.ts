import { Widget } from "@phosphor/widgets";
import { SpreadsheetModelNS, SpreadsheetModel } from "./SpreadsheetModel";
import "slickgrid/lib/jquery-1.8.3.js";
import "slickgrid/lib/jquery.event.drag-2.2.js";
import "slickgrid/lib/jquery-ui-1.9.2.js";
import "slickgrid/slick.core.js";
import "slickgrid/slick.dataview.js";
import "slickgrid/slick.grid.js";
import "slickgrid/slick.grid.css";

export class SpreadsheetWidget extends Widget {
    private readonly view: Slick.Data.DataView<SpreadsheetModelNS.SpreadsheetData>;
    private readonly model: SpreadsheetModel;
    private columnConfig: SpreadsheetModelNS.ColumnList | undefined;
    private grid: Slick.Grid<SpreadsheetModelNS.SpreadsheetData> | undefined;

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
        this.renderGrid();
        console.log("Data loaded", this.view);
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }
        if (this.grid != null) {
            this.grid.destroy();
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
        this.columnConfig = this.model.getColumnConfig(data);
        this.view.beginUpdate();
        this.view.setItems(rows);
        this.view.endUpdate();
    }

    private renderGrid() {
        this.grid = new Slick.Grid(this.node, this.view, this.columnConfig!, {});
    }
}

export namespace SpreadsheetWidgetNS {
    export interface IOptions {
        model: SpreadsheetModel;
    }
}
