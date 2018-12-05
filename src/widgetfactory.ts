import {
    ABCWidgetFactory,
    IDocumentWidget,
    DocumentRegistry,
    DocumentWidget
} from "@jupyterlab/docregistry";
import { SpreadsheetModel } from "./model";
import { SpreadsheetWidget } from "./widget";

export class SpreadsheetWidgetFactory extends ABCWidgetFactory<
                IDocumentWidget<SpreadsheetWidget, SpreadsheetModel>,
                SpreadsheetModel
            > {
    protected createNewWidget(context: DocumentRegistry.IContext<SpreadsheetModel>) {
        const model = context.model;
        const content = new SpreadsheetWidget({model});
        const widget = new DocumentWidget({content, context});
        return widget;
    }
}
