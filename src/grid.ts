//#region SlickGrid ambient imports
// Because SlickGrid isn't exactly WebPack friendly, comes as a global module, predates NPM, and
// makes even the most elderly of frameworks feel young, we need to structure our imports
// carefully. It depends on JQuery and JQuery UI, so we load those first.
// To get global symbols working, we need to use `expose-loader` to set the global symbol,
// since we don't have control over the webpack config.
import "expose-loader?exposes=$,jQuery!jquery";
import "jquery-ui";
import "slickgrid/lib/jquery.event.drag-2.3.0.js";
// Now we load SlickGrid's library folders, in dependency order
import "slickgrid/slick.core.js";
import "slickgrid/slick.dataview.js";
import "slickgrid/slick.grid.js";
// Finally, the built-in stylesheet to make it work
import "slickgrid/slick.grid.css";
//#endregion
import { Widget } from "@lumino/widgets";
import { Subscription, merge } from "rxjs";
import { SpreadsheetModel } from "./model";
import { SpreadsheetFormatter } from "./formatter";
import "../style/grid.css";

/** A convenience wrapper around a SlickGrid component.
 * This wrapper handles things like updating on resize.
 */
export class GridWidget extends Widget {
    private _grid: Slick.Grid<SpreadsheetModel.SpreadsheetData>;
    private _model: SpreadsheetModel;
    private _columnConfig: SpreadsheetModel.ColumnList;
    private _subscription: Subscription;

    constructor({model}: GridWidget.IOptions) {
        super();
        this.addClass("sp-Grid");
        this._model = model;

        this._subscription = merge(
            model.sheetChanged,
            model.workbookChanged
        ).subscribe(() => this.update());

        this._columnConfig = model.getColumnConfig();
        this._grid = this.buildGrid();
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }
        this._subscription.unsubscribe();
        this._grid.destroy();
    }

    protected onUpdateRequest() {
        this._columnConfig = this._model.getColumnConfig();
        this._grid.destroy();
        this._grid = this.buildGrid();
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

    // Force a rebuild of the grid to side-step column initialization issues in
    // SlickGrid
    private buildGrid() {
        const grid = new Slick.Grid(
            this.node,
            this._model,
            this._columnConfig,
            {
                // Cast to any since the typings don't recognize "advanced" formatters
                defaultFormatter: SpreadsheetFormatter as any, //eslint-disable-line
                enableColumnReorder: false,
            }
        );
        return grid;
    }
}

export namespace GridWidget {
    export interface IOptions {
        model: SpreadsheetModel;
    }
}
