import { Widget, PanelLayout, TabBar } from "@phosphor/widgets";
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
import { SpreadsheetFormatter } from "./Formatter";

export class SpreadsheetWidget extends Widget {
    public readonly layout: PanelLayout;
    private readonly model: SpreadsheetModel;
    private readonly tabBar: TabBar<void>;
    private columnConfig: SpreadsheetModelNS.ColumnList | undefined;
    private grid: Slick.Grid<SpreadsheetModelNS.SpreadsheetData> | undefined;

    constructor({model}: SpreadsheetWidgetNS.IOptions) {
        super();
        this.model = model;
        this.layout = new PanelLayout();
        this.tabBar = new TabBar({
            allowDeselect: false, // there must always be a selected sheet
            tabsMovable: false
        });
        this.layout.addWidget(this.tabBar);
        this.tabBar.currentChanged.connect(this.handleSheetChanged, this);
        this.model.workbookChanged.connect(this.handleModelContentChanged, this);
        this.render();
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }
        if (this.grid != null) {
            this.grid.destroy();
        }
        this.tabBar.currentChanged.disconnect(this.handleSheetChanged, this);
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

    private handleSheetChanged(_sender: TabBar<void>,
                               {currentTitle}: TabBar.ICurrentChangedArgs<void>) {
        if (this.grid == null || currentTitle == null) {
            return;
        }
        this.model.setSheet(currentTitle.label);
    }

    private handleModelContentChanged() {
        if (this.grid == null) {
            // how should we handle this case? when does it occur?
            return;
        }
        // Set the sheet names in the tab bar
        this.tabBar.clearTabs();
        const sheetNames = this.model.getSheetNames();
        for (const sheet of sheetNames) {
            this.tabBar.addTab({
                label: sheet,
                owner: void 0
            });
        }
        this.tabBar.currentIndex = sheetNames.indexOf(this.model.activeSheet || "");
        // TODO: Better handling of model changes
        // We do this because of a bug in SlickGrid#setColumns where the new columns have
        // incorrect widths. Obviously this isn't ideal, but works for now.
        this.grid.destroy();
        this.render();
    }

    private render() {
        this.columnConfig = this.model.getColumnConfig();
        this.grid = new Slick.Grid(this.node, this.model, this.columnConfig!, {
            // Cast to any since the typings don't recognize "advanced" formatters
            defaultFormatter: SpreadsheetFormatter as any
        });
        this.grid.getCanvasNode().classList.add("sp-Grid");
    }
}

export namespace SpreadsheetWidgetNS {
    export interface IOptions {
        model: SpreadsheetModel;
    }
}
