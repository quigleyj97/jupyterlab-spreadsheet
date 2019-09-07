import { CellObject } from "xlsx/types";
import { SpreadsheetModel } from "./model";

/**
 * Grid formatter
 *
 * This formatter is naive and trusts the output of SheetJS to be largely correct.
 * This won't address all use cases but is a "good enough" solution to get the grid
 * to display things in a useful manner.
 *
 * SheetJS exposes the following types:
 *  - `b` (Boolean)
 *  - `e` (Error)- The cell is an error code. The formatted property `w` stores the common name.
 *  - `n` (Number)
 *  - `d` (Date or Date-like)
 *  - `s` (String)
 *  - `z` (Stub)
 *
 * For most cases, the value is plumbed through directly. Cells often have a formatted version
 * available, and the formatter will prefer that before falling back to the raw value. This is
 * the fallback strategy:
 *
 *  - HTML encoded RTF of cell string (`h`)
 *  - Formatted string of the cell (`w`)
 *  - Raw value of the cell, coerced to a string
 *
 * The HTML doesn't really support font renderings. Not like we should go overboard anyway, but
 * it'd be nice to have a faithful rendering from the RTF.
 *
 * The following type-specific cases are handled:
 *
 *  - Number: Right-aligned
 *  - Error: Display the text in bold red
 */

export function SpreadsheetFormatter(index: number,
                                     column: number,
                                     value: unknown,
                                     columnCfg: Slick.Column<SpreadsheetModel.SpreadsheetData>,
                                     rowObject: SpreadsheetModel.SpreadsheetData,
                                     grid: Slick.Grid<SpreadsheetModel.SpreadsheetData>) {
    const cell = value as CellObject | null;
    const returnValue = {
        text: "",
        addClasses: "sp-Cell ",
        removeClasses: "sp-Cell-Number sp-Cell-Error sp-Cell-MergeDown"
    };
    const metadata = (grid.getData() as SpreadsheetModel).getItemMetadata(index);
    const colId = columnCfg.id;
    if (colId && metadata.columns && colId in metadata.columns) {
        // check mergeDown
        if (metadata.columns[colId].mergeDown) {
            returnValue.addClasses += "sp-Cell-MergeDown ";
        }
    }
    if (cell == null) {
        return returnValue;
    }
    returnValue.text = cell.h || cell.w || ("" + cell.v);
    const type = cell.t;
    switch (type) {
        case "n":
            returnValue.addClasses += "sp-Cell-Number";
            break;
        case "e":
            returnValue.addClasses += "sp-Cell-Error";
            break;
        default:
            break; // no real handling we can do
    }
    return Object.freeze(returnValue);
}
