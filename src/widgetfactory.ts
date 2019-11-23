import {
    ABCWidgetFactory,
    IDocumentWidget,
    DocumentRegistry,
    DocumentWidget
} from "@jupyterlab/docregistry";
import { SpreadsheetWidget } from "./widget";
import { JupyterSpreadsheetModel } from "./modelfactory";

export class SpreadsheetWidgetFactory extends ABCWidgetFactory<
                IDocumentWidget<SpreadsheetWidget, JupyterSpreadsheetModel>,
                JupyterSpreadsheetModel
            > {
    protected createNewWidget(context: DocumentRegistry.IContext<JupyterSpreadsheetModel>) {
        const model = context.model.model;
        const content = new SpreadsheetWidget({model});
        const widget = new DocumentWidget({content, context});
        return widget;
    }
}
