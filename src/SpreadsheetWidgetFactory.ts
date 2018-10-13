import { ABCWidgetFactory, IDocumentWidget, DocumentRegistry, DocumentWidget } from "@jupyterlab/docregistry";
import { SpreadsheetModel } from "./SpreadsheetModel";
import { SpreadsheetWidget } from "./SpreadsheetWidget";

export class SpreadsheetWidgetFactory extends ABCWidgetFactory<IDocumentWidget<SpreadsheetWidget>, SpreadsheetModel> {
    protected createNewWidget(context: DocumentRegistry.CodeContext) {
        const content = new SpreadsheetWidget({});
        const widget = new DocumentWidget({content, context});
        return widget;
    }
}
