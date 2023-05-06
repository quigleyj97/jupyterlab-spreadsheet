import { Widget, TabBar, BoxLayout } from "@lumino/widgets";
import { SpreadsheetModel } from "./model";
import { GridWidget } from "./grid";
import "../style/widget.css";
import { Subscription } from "rxjs";

export class SpreadsheetWidget extends Widget {
    private readonly model: SpreadsheetModel;
    private readonly tabBar: TabBar<void>;
    private readonly grid: GridWidget;
    private readonly _subscription: Subscription;

    constructor({model}: SpreadsheetWidget.IOptions) {
        super();
        this.addClass(SpreadsheetWidget.CSS_CLASS);
        this.model = model;
        this.layout = new BoxLayout({});
        this.grid = new GridWidget({model});
        this.tabBar = new TabBar({
            allowDeselect: false, // there must always be a selected sheet
            tabsMovable: false
        });
        (this.layout as BoxLayout).addWidget(this.grid);
        (this.layout as BoxLayout).addWidget(this.tabBar);
        BoxLayout.setSizeBasis(this.tabBar, 26);
        BoxLayout.setStretch(this.grid, 1);
        this.tabBar.currentChanged.connect(this.handleSheetChanged, this);
        this._subscription = this.model
            .workbookChanged
            .subscribe(() => this.handleModelContentChanged());
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }
        this.grid.dispose();
        this.tabBar.dispose();
        this._subscription.unsubscribe();
        super.dispose();
    }

    private handleSheetChanged(_sender: TabBar<void>,
                               {currentTitle}: TabBar.ICurrentChangedArgs<void>) {
        if (currentTitle == null) {
            return;
        }
        this.model.setSheet(currentTitle.label);
    }

    private handleModelContentChanged() {
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
    }
}

export namespace SpreadsheetWidget {
    export const CSS_CLASS = "sp-SpreadsheetWidget";

    export interface IOptions {
        model: SpreadsheetModel;
    }
}
