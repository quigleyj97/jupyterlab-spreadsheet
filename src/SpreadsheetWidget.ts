import { Widget, PanelLayout, TabBar, StackedLayout, BoxLayout } from "@phosphor/widgets";
import { SpreadsheetModel } from "./SpreadsheetModel";
import { GridWidget } from "./GridWidget";
import "../style/WidgetStyle.css";

export class SpreadsheetWidget extends Widget {
    public readonly layout: BoxLayout;
    private readonly model: SpreadsheetModel;
    private readonly tabBar: TabBar<void>;
    private readonly grid: GridWidget;

    constructor({model}: SpreadsheetWidgetNS.IOptions) {
        super();
        this.addClass(SpreadsheetWidgetNS.CSS_CLASS);
        this.model = model;
        this.layout = new BoxLayout({});
        this.grid = new GridWidget({model});
        this.tabBar = new TabBar({
            allowDeselect: false, // there must always be a selected sheet
            tabsMovable: false
        });
        this.layout.addWidget(this.grid);
        this.layout.addWidget(this.tabBar);
        BoxLayout.setSizeBasis(this.tabBar, 26);
        BoxLayout.setStretch(this.grid, 1);
        this.tabBar.currentChanged.connect(this.handleSheetChanged, this);
        this.model.workbookChanged.connect(this.handleModelContentChanged, this);
    }

    public dispose() {
        if (this.isDisposed) {
            return;
        }
        this.grid.dispose();
        this.tabBar.dispose();
        this.model.workbookChanged.disconnect(this.handleModelContentChanged, this);
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

export namespace SpreadsheetWidgetNS {
    export const CSS_CLASS = "sp-SpreadsheetWidget";

    export interface IOptions {
        model: SpreadsheetModel;
    }
}
