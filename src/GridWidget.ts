//#region SlickGrid ambient imports
// Because SlickGrid isn't exactly WebPack friendly, comes as a global module, predates NPM, and
// makes even the most elderly of frameworks feel young, we need to structure our imports
// carefully. It comes with bundled verions of JQuery and JQuery UI, so we load those first.
import "slickgrid/lib/jquery-1.8.3.js";
import "slickgrid/lib/jquery.event.drag-2.2.js";
import "slickgrid/lib/jquery-ui-1.9.2.js";
// Now we load SlickGrid's library folders, in dependency order
import "slickgrid/slick.core.js";
import "slickgrid/slick.dataview.js";
import "slickgrid/slick.grid.js";
// Finally, the built-in stylesheet to make it work
import "slickgrid/slick.grid.css";
//#endregion
import { Widget } from "@phosphor/widgets";
import { SpreadsheetModel, SpreadsheetModelNS } from "./SpreadsheetModel";
import { SpreadsheetFormatter } from "./Formatter";
import "../style/GridStyle.css";

/** A convenience wrapper around a SlickGrid component.
 * This wrapper handles things like updating on resize.
 */
export class GridWidget extends Widget {
    private _grid: Slick.Grid<SpreadsheetModelNS.SpreadsheetData>;
    private _model: SpreadsheetModel;
    private _columnConfig: SpreadsheetModelNS.ColumnList;

    constructor({model}: GridWidget.IOptions) {
        super();
        this._model = model;
        model.sheetChanged.connect(this.update, this);
        model.workbookChanged.connect(this.update, this);
        this._columnConfig = model.getColumnConfig();
        this._grid = new Slick.Grid(
            this.node,
            this._model,
            this._columnConfig,
            {
                // Cast to any since the typings don't recognize "advanced" formatters
                defaultFormatter: SpreadsheetFormatter as any
            }
        );
        this._grid.getCanvasNode().classList.add("sp-Grid");
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }
        this._model.sheetChanged.disconnect(this.update, this);
        this._model.workbookChanged.disconnect(this.update, this);
        this._grid.destroy();
    }

    protected onUpdateRequest() {
        const columns = this._model.getColumnConfig();
        this._grid.setColumns(columns);
        this._grid.render();
    }

    // TODO: The SlickGrid will might need to be reconstructed after a detatch/attach,
    // but we have no handling for that right now.

    protected onAfterShow() {
        if (this._grid == null) return;
        this._grid.render();
    }

    protected onResize() {
        if (this._grid == null) return;
        this._grid.resizeCanvas();
    }
}

export namespace GridWidget {
    export interface IOptions {
        model: SpreadsheetModel;
    }
}
