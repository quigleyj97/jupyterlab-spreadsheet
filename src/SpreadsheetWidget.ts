import { Widget } from "@phosphor/widgets";
import { SpreadsheetModelNS, SpreadsheetModel } from "./SpreadsheetModel";
//#region SlickGrid ambient imports
// Because SlickGrid isn't exactly WebPack friendly, comes as a global module, predates NPM, and
// makes even the most elderly of frameworks feel young, we need to structure our imports
// carefully. It comes with bundled verions of JQuery and JQuery UI, so we load those first.
import "slickgrid/lib/jquery-1.8.3.js";
import "slickgrid/lib/jquery.event.drag-2.2.js";
import "slickgrid/lib/jquery-ui-1.9.2.js";
import "slickgrid/slick.core.js";
import "slickgrid/slick.dataview.js";
import "slickgrid/slick.grid.js";
import "slickgrid/slick.grid.css";
//#endregion
// CSS style import
import "../style/GridStyle.css";

export class SpreadsheetWidget extends Widget {
    private readonly model: SpreadsheetModel;
    private columnConfig: SpreadsheetModelNS.ColumnList | undefined;
    private grid: Slick.Grid<SpreadsheetModelNS.SpreadsheetData> | undefined;

    constructor({model}: SpreadsheetWidgetNS.IOptions) {
        super();
        this.model = model;
        this.model.workbookChanged.connect(this.handleModelContentChanged, this);
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }
        if (this.grid != null) {
            this.grid.destroy();
        }
        // TODO: Should the model be disposed as well?
        this.model.workbookChanged.disconnect(this.handleModelContentChanged, this);
        super.dispose();
    }

    // TODO: The SlickGrid will might need to be reconstructed after a detatch/attach,
    // but we have no handling for that right now.

    protected onAfterShow() {
        if (this.grid == null) return;
        this.grid.render();
    }

    protected onResize() {
        if (this.grid == null) return;
        this.grid.resizeCanvas();
    }

    private handleModelContentChanged() {
        this.render();
    }

    private render() {
        this.columnConfig = this.model.getColumnConfig();
        this.grid = new Slick.Grid(this.node, this.model, this.columnConfig!, {});
        this.grid.getCanvasNode().classList.add("sp-Grid");
    }
}

export namespace SpreadsheetWidgetNS {
    export interface IOptions {
        model: SpreadsheetModel;
    }
}
